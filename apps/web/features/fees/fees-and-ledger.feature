@web @mobile @needs-server
Feature: Fees and the ledger
  The office keeps heads, structures, demands and receipts; families read what is due and what was paid. Money
  never touches the platform (decision 0003): the gateway is the school's, the platform records and reconciles.
  The stored totals are derived values and must add up on every read.

  @happy
  Scenario: The office's overview adds up: outstanding is demanded less collected
    Given I am signed in as the ADMIN
    When I GET "/api/v1/fees/overview"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "totals.outstandingPaise" equals the field "totals.demandedPaise" minus the field "totals.collectedPaise"
    And the field "totals.demandedPaise" equals the sum of "demandedPaise" over "byGrade"
    And the field "totals.collectedPaise" equals the sum of "collectedPaise" over "byGrade"

  @happy
  Scenario: Each pupil's dues are net less paid
    Given I am signed in as the ADMIN
    When I GET "/api/v1/fees/dues"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "rows" is a list of at least 1 item
    And the field "rows[0].outstandingPaise" equals the field "rows[0].netPaise" minus the field "rows[0].paidPaise"

  @happy
  Scenario: A guardian reads their child's demands, payments and receipt
    Given I am signed in as the PARENT
    When I GET "/api/v1/fees/family"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "child.demands" is a list of at least 1 item
    And the field "child.demands[0].outstandingPaise" equals the field "child.demands[0].netPaise" minus the field "child.demands[0].paidPaise"
    And the field "child.totals.paidPaise" equals the sum of "amountPaise" over "child.payments"
    When I remember the "receiptId" of the first item of "child.payments" as "receipt"
    And I GET "/api/v1/fees/receipts/{{receipt}}"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "reversed" equals false
    And the field "snapshot.pupil.name" equals "ZZ Aarav Apte"

  @alternative
  Scenario: A pupil old enough reads their own fees
    Given I am signed in as the STUDENT
    When I GET "/api/v1/family/fees/mine"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "allowed" equals true
    And every item of "demands" has "status" present

  @alternative
  Scenario: A college's accounts office reads the same overview, and it adds up
    Given I am signed in as the ACCOUNTS
    When I GET "/api/v1/fees/overview"
    Then the status is 200
    And the field "totals.outstandingPaise" equals the field "totals.demandedPaise" minus the field "totals.collectedPaise"

  @alternative
  Scenario: The college student's ledger is the college's alone
    Given I am signed in as the PARENT
    When I GET "/api/v1/student/ledger"
    Then the status is 403
    And the error code is "MODULE_OFF"

  @negative
  Scenario: A payment with no amount, pupil or method is refused for its shape
    Given I am signed in as the ADMIN
    When I POST "/api/v1/fees/payments" with:
      """
      {}
      """
    Then the status is 422

  @negative
  Scenario: A teacher cannot read the school's dues
    Given I am signed in as the TEACHER
    When I GET "/api/v1/fees/dues"
    Then the status is 403

  @negative
  Scenario: Another family cannot open this family's receipt
    Given I am signed in as the PARENT
    When I GET "/api/v1/fees/family"
    And I remember the "receiptId" of the first item of "child.payments" as "receipt"
    Given I am signed in as the PARENT zz.parent02@zz.test
    When I GET "/api/v1/fees/receipts/{{receipt}}"
    Then the status is one of 403, 404
    And the answer does not contain "ZZ Aarav Apte"

  @negative
  Scenario: With no gateway of the school's own, a family's online checkout is refused
    Given I am signed in as the PARENT
    When I GET "/api/v1/fees/family"
    Then the field "child.options.online" equals false
    When I POST "/api/v1/fees/family/checkout" with:
      """
      {}
      """
    Then the status is one of 409, 422

  @negative
  Scenario: Another school's office cannot read this school's pupil's fee page
    Given I am signed in as the ADMIN
    When I GET "/api/v1/fees/dues"
    And I remember the "studentMembershipId" of the first item of "rows" as "pupil"
    Given I am signed in as the ADMIN zz.admin.b@zz.test
    When I GET "/api/v1/fees/pupils/{{pupil}}"
    Then the status is one of 403, 404
