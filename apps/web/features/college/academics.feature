@web @mobile @needs-server
Feature: College academics
  Departments, programmes and schemes; registration per term; lecture attendance against the 75 % rule with
  condonation; internal marks locked by the HOD. Fixture term czzacterm000000000001 at ZZ Vidya College.

  @happy
  Scenario: A faculty member's home names the term and their offerings
    Given I am signed in as the FACULTY
    When I GET "/api/v1/academics/faculty-home"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "term.id" equals "czzacterm000000000001"
    And the field "offerings" is a list of at least 1 item

  @happy
  Scenario: The HOD's home shows the department's teaching load
    Given I am signed in as the HOD
    When I GET "/api/v1/academics/hod-home"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "department.code" is present
    And the field "load" is a list of at least 1 item

  @happy
  Scenario: A student reads their registration for the term
    Given I am signed in as the STUDENT zz.cstudent01@zz.test
    When I GET "/api/v1/academics/mine"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "registration.programme.prn" is present

  @alternative
  Scenario: The 75 % rule: a row under the threshold and not condoned is not eligible
    Given I am signed in as the HOD
    When I GET "/api/v1/academics/eligibility?termId=czzacterm000000000001"
    Then the status is 200
    And the answer matches the catalog contract
    And every item of "rows" has "threshold" equal to 75
    And every row under its threshold and not condoned is not eligible

  @alternative
  Scenario: The head reads the whole college
    Given I am signed in as the PRINCIPAL zz.cprincipal@zz.test
    When I GET "/api/v1/principal/college"
    Then the status is 200
    And the answer matches the catalog contract

  @negative
  Scenario: A school has no academics module
    Given I am signed in as the ADMIN
    When I GET "/api/v1/academics/structure"
    Then the status is 403
    And the error code is "MODULE_OFF"

  @negative
  Scenario: A student cannot read an offering's internal marks sheet
    Given I am signed in as the STUDENT zz.cstudent01@zz.test
    When I GET "/api/v1/academics/offerings/czzacoffer00000000001/internal"
    Then the status is 403

  @negative
  Scenario: A lecture's attendance with no marks is refused for its shape
    Given I am signed in as the FACULTY
    When I POST "/api/v1/academics/lectures/czzaclect000000000001/attendance" with:
      """
      {}
      """
    Then the status is 422

  # Missing: agriculture. docs/college.md, "Not built, per stream": AGRICULTURE (ICAR) is listed as a stream but the
  # farm and field work and the ICAR return are not built; the registrar's home shows the preset's banner only.
  @missing
  Scenario: An agriculture college keeps its students' field work on the farm
    Given I am signed in as the FACULTY
    Then the catalog lists "GET /api/v1/duties/field-work"
    When I GET "/api/v1/duties/field-work"
    Then the status is 200
