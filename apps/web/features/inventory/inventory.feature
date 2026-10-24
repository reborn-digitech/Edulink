@web @mobile @needs-server
Feature: Inventory
  The office keeps categories, vendors, items with stock by movement, assets by tag with a custodian, purchases
  and the staff's requests; a member of staff reads what is issued to them and asks for more. The fixture's
  asset is ZZ-A-0001, a projector in Grade 3 A.

  @happy
  Scenario: The office's dashboard counts what its lists hold
    Given I am signed in as the ADMIN
    When I GET "/api/v1/admin/inventory"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "counts.lowStock" equals the number of items of "lowStock"
    And every item of "lowStock" has "low" equal to true

  @happy
  Scenario: An asset is found by its tag with its custodian
    Given I am signed in as the ADMIN
    When I GET "/api/v1/admin/inventory/assets/ZZ-A-0001"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "asset.tagNumber" equals "ZZ-A-0001"
    And the field "asset.custodianName" is present

  @alternative
  Scenario: A teacher reads what is issued to them and their own requests
    Given I am signed in as the TEACHER
    When I GET "/api/v1/account/inventory"
    Then the status is 200
    And the answer matches the catalog contract
    And some item of "assets" has "tagNumber" equal to "ZZ-A-0001"

  @alternative
  Scenario: The college's accounts office reads the same dashboard
    Given I am signed in as the ACCOUNTS
    When I GET "/api/v1/admin/inventory"
    Then the status is 200

  @negative
  Scenario: A movement with no item and no quantity is refused for its shape
    Given I am signed in as the ADMIN
    When I POST "/api/v1/admin/inventory/movements" with:
      """
      {}
      """
    Then the status is 422

  @negative
  Scenario: The head reads the stock but does not move it
    Given I am signed in as the PRINCIPAL
    When I GET "/api/v1/admin/inventory/items"
    Then the status is 200
    When I POST "/api/v1/admin/inventory/movements" with:
      """
      {}
      """
    Then the status is 403

  @negative
  Scenario: A pupil cannot read the store
    Given I am signed in as the STUDENT
    When I GET "/api/v1/admin/inventory"
    Then the status is 403

  @negative
  Scenario: An unknown tag is not found
    Given I am signed in as the ADMIN
    When I GET "/api/v1/admin/inventory/assets/ZZ-NO-SUCH-TAG"
    Then the status is 404
