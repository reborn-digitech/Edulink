@web @mobile @needs-server
Feature: Attendance registers
  A form teacher takes the class register for the day; the office reads the trend; a guardian reads their
  child's days. The register's write door (/api/attendance) is the one the offline outbox replays.

  Background:
    Given I am signed in as the TEACHER zz.teacher1@zz.test

  @happy
  Scenario: A teacher's classes for today say which registers are still to take
    When I GET "/api/v1/staff/attendance/classes"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "classes" is a list of at least 1 item
    And the field "unmarkedCount" equals the number of items of "classes" whose "taken" equals false

  @happy
  Scenario: A teacher opens a class register for a day and sees its roster
    When I GET "/api/v1/staff/attendance/classes"
    And I remember the "id" of the first item of "classes" as "classId"
    And I GET "/api/attendance?classId={{classId}}&date=2020-01-08"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "class.id" equals "{{classId}}"
    And the field "roster" is a list of at least 1 item
    And every item of "roster" has "membershipId" present

  @alternative
  Scenario: A teacher's own staff attendance adds up to the month's working days
    When I GET "/api/v1/staff/attendance/me"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "summary.workingDays" is at least 1

  @alternative
  Scenario: The office reads the school's thirty-day trend
    Given I am signed in as the ADMIN
    When I GET "/api/v1/admin/attendance"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "windowDays" equals 30
    And the field "trend" is a list of at least 1 item

  @alternative
  Scenario: A guardian reads their children's attendance
    Given I am signed in as the PARENT
    When I GET "/api/v1/family/attendance"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "children" is a list of at least 1 item
    And every item of "children" has "schoolName" equal to "ZZ Northgate School"

  @negative
  Scenario: A register for a future date is refused
    When I GET "/api/v1/staff/attendance/classes"
    And I remember the "id" of the first item of "classes" as "classId"
    And I GET "/api/attendance?classId={{classId}}&date=2020-01-08"
    And I remember the "membershipId" of the first item of "roster" as "pupil"
    And I POST "/api/attendance" with:
      """
      { "classId": "{{classId}}", "dateKey": "2099-01-01", "marks": [ { "studentMembershipId": "{{pupil}}", "status": "PRESENT", "clientId": "zz-bdd-future-0001" } ] }
      """
    Then the status is 422

  @negative
  Scenario: A register with no marks is refused for its shape
    When I GET "/api/v1/staff/attendance/classes"
    And I remember the "id" of the first item of "classes" as "classId"
    And I POST "/api/attendance" with:
      """
      { "classId": "{{classId}}", "dateKey": "2020-01-08", "marks": [] }
      """
    Then the status is 422

  @negative
  Scenario: Another school's office cannot open this school's register
    When I GET "/api/v1/staff/attendance/classes"
    And I remember the "id" of the first item of "classes" as "classId"
    Given I am signed in as the ADMIN zz.admin.b@zz.test
    When I GET "/api/attendance?classId={{classId}}"
    Then the status is one of 403, 404
    And the answer does not contain "roster"

  @negative
  Scenario: The head reads the trend only through the office's door, which is the admin's
    Given I am signed in as the PRINCIPAL
    When I GET "/api/v1/admin/attendance"
    Then the status is 403

  @negative
  Scenario: A pupil cannot read a class register
    Given I am signed in as the STUDENT
    When I GET "/api/v1/staff/attendance/classes"
    Then the status is 403
