@web @mobile @needs-server
Feature: Payroll
  The office keeps salary structures and each member of staff's salary, runs a month, locks it and shares it
  with the head; statutory exports (PF ECR and the rest) come from a locked run; a member of staff reads their
  own payslips. The fixture's locked month is 2026-08.

  @happy
  Scenario: A locked month's totals add up: net is gross less deductions
    Given I am signed in as the ADMIN
    When I GET "/api/v1/admin/payroll/runs/2026-08"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "status" equals "LOCKED"
    And the field "totals.netPaise" equals the field "totals.grossPaise" minus the field "totals.deductionsPaise"
    And the field "totals.headcount" equals the number of items of "slips"
    And the field "totals.grossPaise" equals the sum of "grossPaise" over "slips"

  @happy
  Scenario: A member of staff reads their own payslips and the month's PDF
    Given I am signed in as the TEACHER
    When I GET "/api/v1/account/payslips"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "structure.monthlyGrossPaise" equals the sum of "monthlyPaise" over "structure.components"
    When I GET "/api/v1/account/payslips/2026-08/pdf"
    Then the status is one of 200, 404

  @alternative
  Scenario: The head reads a shared run
    Given I am signed in as the PRINCIPAL
    When I GET "/api/v1/admin/payroll/runs/2026-08"
    Then the status is 200
    And the field "sharedWithPrincipal" equals true

  @alternative
  Scenario: The PF return of a locked month adds up line by line
    # An ECR line's EPS share and EPF-EPS difference are the employer's 12 %, which equals the employee's share
    # where EPF and EPS wages are the same; the return's total is the sum of what its lines remit.
    Given I am signed in as the ADMIN
    When I GET "/api/v1/admin/payroll/runs/2026-08/export/pf-ecr"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "rows" equals 3
    And every line of the PF return splits the employer's share exactly between EPS and the difference
    And the PF return's total is the sum of its lines' contributions

  @negative
  Scenario: A teacher cannot read the school's payroll
    Given I am signed in as the TEACHER
    When I GET "/api/v1/admin/payroll"
    Then the status is 403

  @negative
  Scenario: The head cannot run a month
    Given I am signed in as the PRINCIPAL
    When I POST "/api/v1/admin/payroll/runs" with:
      """
      { "month": "2026-09" }
      """
    Then the status is 403

  @negative
  Scenario: A run with no month is refused for its shape
    Given I am signed in as the ADMIN
    When I POST "/api/v1/admin/payroll/runs" with:
      """
      {}
      """
    Then the status is 422
