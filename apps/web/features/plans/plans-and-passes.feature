@web @mobile @needs-server
Feature: Plans and passes
  A pass is a plan sold to a person (STUDENT, TEACHER, EXPERT): it opens the features the operator puts behind a
  plan (Vidura for a pupil, among others) while the plan is active. A guardian buys for their child, a pupil may
  ask a guardian; the price carries GST; the operator sees the orders and grants or revokes entitlements. School
  plans (caps on pupils, messages, storage) are the operator's too.

  @happy
  Scenario: A pupil sees the pass they hold and the prices, which add up with GST
    Given I am signed in as the STUDENT
    When I GET "/api/v1/account/pass"
    Then the status is 200
    And the answer matches the catalog contract
    And some item of "held" has "plan" equal to "STUDENT"
    And every price offered is its amount plus GST at the stated rate

  @happy
  Scenario: A guardian is offered a pass for each child, held by the child and not by them
    Given I am signed in as the PARENT
    When I GET "/api/v1/account/pass"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "held" is an empty list
    And every item of "offers" has "holder.self" equal to false
    And every item of "offers" has "holder.studentMembershipId" present
    And every price offered is its amount plus GST at the stated rate

  @alternative
  Scenario: A teacher holds the teacher's plan
    Given I am signed in as the TEACHER
    When I GET "/api/v1/account/pass"
    Then the status is 200
    And some item of "held" has "plan" equal to "TEACHER"

  @alternative
  Scenario: The operator reads a person's entitlements and the month's pass orders
    Given I am signed in as the OPERATOR
    When I GET "/api/v1/operator/entitlements?email=zz.pupil01@zz.test"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "person.email" equals "zz.pupil01@zz.test"
    When I GET "/api/v1/operator/pass-orders"
    Then the status is 200
    And the answer matches the catalog contract
    And some item of "revenue" has "plan" equal to "STUDENT"

  @alternative
  Scenario: A pupil without a pass meets the plan card at a door behind a plan
    # Needs a feature on and its plan active; the dev database has both off (accounts.md), so this is skipped
    # unless the operator switches them on for a run. With both on it asks for the plan card itself (TA-467), never
    # "200 or 402", which passed whether or not the gate answered.
    Given the platform feature "ASSISTANT" is on
    And the plan "STUDENT" is active
    And I am signed in as the STUDENT zz.pupil02@zz.test
    And I hold no "STUDENT" pass
    When I GET "/api/v1/assistant"
    Then the status is 402
    And the error code is "PLAN_REQUIRED"

  @negative
  Scenario: The office has no pass to buy
    Given I am signed in as the ADMIN
    When I GET "/api/v1/account/pass"
    Then the status is 200
    And the field "offers" is an empty list
    When I POST "/api/v1/account/pass/checkout" with:
      """
      {}
      """
    Then the status is 403

  @negative
  Scenario: A checkout with no plan and no period is refused for its shape
    Given I am signed in as the PARENT
    When I POST "/api/v1/account/pass/checkout" with:
      """
      {}
      """
    Then the status is 422

  @negative
  Scenario: Only the operator reads entitlements
    Given I am signed in as the APPADMIN
    When I GET "/api/v1/operator/entitlements?email=zz.pupil01@zz.test"
    Then the status is 403
