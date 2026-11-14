@mobile @web @needs-server
Feature: A register replayed from the offline queue
  The register's write door (/api/attendance) is the one the outbox replays, so it must be safe to call twice:
  a mark carrying a client id already stored is a no-op, and an older mark arriving late loses to the newer one.
  A replay names the person who queued it (X-Edulink-Owner); the server answers anyone else 401. The scenarios
  write ZZ Northgate's register for 2020-01-08, the API sweep's own register day, one pupil, fixed client ids, so
  a second run of the suite is itself a replay. That day is long past a class teacher's fourteen days (TA-285), so
  the office's phone queues the writes that are taken, and the teacher's own is refused for good.

  Background:
    Given I am signed in as the TEACHER zz.teacher1@zz.test
    When I GET "/api/v1/staff/attendance/classes"
    And I remember the "id" of the first item of "classes" whose "name" equals "ZZ Grade 3 · A" as "classId"
    And I GET "/api/attendance?classId={{classId}}&date=2020-01-08"
    And I remember the "membershipId" of the first item of "roster" as "pupil"
    And the phone's outbox is empty
    And the phone is signed in as the person of this session

  @happy
  Scenario: A register queued offline is sent when the network is back, and its replay changes nothing
    Given I am signed in as the ADMIN
    And the phone is signed in as the person of this session
    When the phone queues POST "/api/attendance" with:
      """
      { "classId": "{{classId}}", "dateKey": "2020-01-08",
        "marks": [ { "studentMembershipId": "{{pupil}}", "status": "PRESENT", "clientId": "zz-bdd-replay-0001", "markedAt": "2020-01-08T04:00:00.000Z" } ] }
      """
    And the phone queues POST "/api/attendance" with:
      """
      { "classId": "{{classId}}", "dateKey": "2020-01-08",
        "marks": [ { "studentMembershipId": "{{pupil}}", "status": "PRESENT", "clientId": "zz-bdd-replay-0001", "markedAt": "2020-01-08T04:00:00.000Z" } ] }
      """
    And the outbox flushes to the dev server
    Then the dev server answered the rows 200 then 200
    And every row sent named its owner as the person signed in
    And the outbox holds 0 rows for the person signed in
    And the field "applied" equals 0
    And the field "skipped" equals 1

  @alternative
  Scenario: An older mark arriving late does not undo the newer one
    Given I am signed in as the ADMIN
    And the phone is signed in as the person of this session
    When the phone queues POST "/api/attendance" with:
      """
      { "classId": "{{classId}}", "dateKey": "2020-01-08",
        "marks": [ { "studentMembershipId": "{{pupil}}", "status": "PRESENT", "clientId": "zz-bdd-replay-0001", "markedAt": "2020-01-08T04:00:00.000Z" } ] }
      """
    And the phone queues POST "/api/attendance" with:
      """
      { "classId": "{{classId}}", "dateKey": "2020-01-08",
        "marks": [ { "studentMembershipId": "{{pupil}}", "status": "ABSENT", "clientId": "zz-bdd-replay-older", "markedAt": "2020-01-08T03:00:00.000Z" } ] }
      """
    And the outbox flushes to the dev server
    Then the dev server answered the rows 200 then 200
    When I GET "/api/attendance?classId={{classId}}&date=2020-01-08"
    Then some item of "roster" has "status" equal to "PRESENT"
    And no item of "roster" has "status" equal to "ABSENT"

  @negative
  Scenario: A replay that names another person is not signed in, and the phone keeps the row
    Given the next request carries the header "X-Edulink-Owner" set to "zz-bdd-someone-else"
    When I POST "/api/attendance" with:
      """
      { "classId": "{{classId}}", "dateKey": "2020-01-08",
        "marks": [ { "studentMembershipId": "{{pupil}}", "status": "PRESENT", "clientId": "zz-bdd-replay-0001" } ] }
      """
    Then the status is 401

  @negative
  Scenario: A replay of a register for a future day is refused for good and dropped from the phone
    When the phone queues POST "/api/attendance" with:
      """
      { "classId": "{{classId}}", "dateKey": "2099-01-01",
        "marks": [ { "studentMembershipId": "{{pupil}}", "status": "PRESENT", "clientId": "zz-bdd-replay-future" } ] }
      """
    And the outbox flushes to the dev server
    Then the dev server answered the rows 422
    And the outbox holds 0 rows for the person signed in
    And the outbox reported 1 rejected with status 422

  @negative
  Scenario: A teacher's waiting register sent more than fourteen days after its date is refused for good and goes to the office
    When the phone queues POST "/api/attendance" with:
      """
      { "classId": "{{classId}}", "dateKey": "2020-01-08",
        "marks": [ { "studentMembershipId": "{{pupil}}", "status": "ABSENT", "clientId": "zz-bdd-replay-closed", "markedAt": "2020-01-08T04:30:00.000Z" } ] }
      """
    And the outbox flushes to the dev server
    Then the dev server answered the rows 403
    And the outbox holds 0 rows for the person signed in
    And the outbox reported 1 rejected with status 403
