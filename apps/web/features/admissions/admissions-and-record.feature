@web @mobile @needs-server
Feature: Admissions and the pupil's record
  The office runs admission cycles (application, documents, test, offer, admit); a family sees the open cycle
  of a school. The pupil record is the office's to write: a guardian or the pupil proposes a change with a
  reason, and the office applies it or declines with a sentence.

  @happy
  Scenario: The office lists its cycles and applications
    Given I am signed in as the ADMIN
    When I GET "/api/v1/office/admissions/cycles"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "cycles" is a list of at least 1 item
    When I GET "/api/v1/office/admissions/applications"
    Then the status is 200
    And the answer matches the catalog contract
    And some item of "items" has "status" equal to "SUBMITTED"
    When I remember the "id" of the first item of "items" whose "status" equals "SUBMITTED" as "application"
    And I GET "/api/v1/office/admissions/applications/{{application}}"
    Then the status is 200
    And the answer matches the catalog contract

  @happy
  Scenario: A family sees a school's open cycle with seats remaining per grade
    Given I am signed in as the PARENT
    When I GET "/api/v1/me"
    And I remember the field "contexts[0].schoolId" as "school"
    And I GET "/api/v1/shared/schools/{{school}}/admissions"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "open.grades" is a list of at least 1 item

  @happy
  Scenario: A guardian reads their child's record and the asks they have made
    Given I am signed in as the PARENT
    When I GET "/api/v1/family/record"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "studentName" equals "ZZ Aarav Apte"
    When I GET "/api/v1/family/record/changes"
    Then the status is 200
    And the answer matches the catalog contract
    And some item of "items" has "status" equal to "DECLINED"
    And some item of "items" has "declineReason" present

  @alternative
  Scenario: The office's queue holds the waiting asks with the fields they would change
    Given I am signed in as the ADMIN
    When I GET "/api/v1/office/record-changes"
    Then the status is 200
    And the answer matches the catalog contract
    And some item of "items" has "status" equal to "PENDING"
    And every item of "items" has "reason" present

  @negative
  Scenario: The family's old direct write to the record is gone
    Given I am signed in as the PARENT
    When I POST "/api/v1/family/record" with:
      """
      { "addressLine": "anything" }
      """
    Then the status is one of 404, 405
    And the catalog does not list "POST /api/v1/family/record"

  @negative
  Scenario: An ask with no field and no reason is refused for its shape
    Given I am signed in as the PARENT
    When I POST "/api/v1/family/record/changes" with:
      """
      {}
      """
    Then the status is 422

  @negative
  Scenario: A teacher cannot see the school's applications
    Given I am signed in as the TEACHER
    When I GET "/api/v1/office/admissions/applications"
    Then the status is 403

  @negative
  Scenario: A guardian cannot decide their own ask
    Given I am signed in as the PARENT
    When I POST "/api/v1/office/record-changes/zz-fixture-record-change/decide" with:
      """
      { "decision": "APPLY" }
      """
    Then the status is 403
