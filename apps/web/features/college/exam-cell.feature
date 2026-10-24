@web @mobile @needs-server
Feature: The college's exam cell
  The exam controller runs sessions: forms with eligibility and no-dues, schedules and seating, hall tickets,
  marks by double entry or import, results with SGPA and CGPA, revaluation and backlogs. Full conduct (papers,
  the controller's own question papers) belongs to an autonomous college. ZZ Vidya College is affiliated.

  @happy
  Scenario: The controller's desk at an affiliated college
    Given I am signed in as the EXAM_CONTROLLER
    When I GET "/api/v1/exam-cell"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "autonomous" equals false
    And the field "terms" is a list of at least 1 item

  @happy
  Scenario: A published result adds up: every student is passed, allowed to keep terms, or failed
    Given I am signed in as the EXAM_CONTROLLER
    When I GET "/api/v1/exam-cell/sessions/czzexsess000000000001/results"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "run.status" equals "PUBLISHED"
    And the field "run.students" equals the sum of the fields "run.passed", "run.atkt", "run.failed"
    And the field "run.students" equals the number of items of "rows"
    And the field "run.passRatePercent" equals "run.passed" as a percentage of "run.students" to 1 decimal place

  @happy
  Scenario: A student reads their own exam forms
    Given I am signed in as the STUDENT zz.cstudent01@zz.test
    When I GET "/api/v1/exam-cell/mine"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "forms" is a list of at least 1 item

  @alternative
  Scenario: The head reads the cell's analytics
    Given I am signed in as the PRINCIPAL zz.cprincipal@zz.test
    When I GET "/api/v1/exam-cell/analytics"
    Then the status is 200
    And the answer matches the catalog contract

  @negative
  Scenario: An affiliated college does not conduct the university's papers itself
    Given I am signed in as the EXAM_CONTROLLER
    When I GET "/api/v1/exam-cell/sessions/czzexsess000000000003/conduct"
    Then the status is 403

  @negative
  Scenario: A student cannot read the whole result sheet
    Given I am signed in as the STUDENT zz.cstudent01@zz.test
    When I GET "/api/v1/exam-cell/sessions/czzexsess000000000001/results"
    Then the status is 403

  @negative
  Scenario: A faculty member is refused the controller's desk
    Given I am signed in as the FACULTY
    When I GET "/api/v1/exam-cell"
    Then the status is 403

  @negative
  Scenario: A school has no exam cell
    Given I am signed in as the ADMIN
    When I GET "/api/v1/exam-cell"
    Then the status is 403
    And the error code is "MODULE_OFF"
