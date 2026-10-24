@web @mobile @needs-server
Feature: Hostel
  The warden keeps hostels, rooms, beds, allotments, the night's roll call, leave, visitors and the mess; the
  head decides an expulsion; a family reads their boarder's room, tonight's roll and the menu. The fixture is
  ZZ Tilak House (czzhostel000000000001) at ZZ Northgate.

  @happy
  Scenario: The warden's hostels add up: no hostel holds more boarders than beds
    Given I am signed in as the WARDEN
    When I GET "/api/v1/hostel/hostels"
    Then the status is 200
    And the answer matches the catalog contract
    And every item of "hostels" has "occupied" no more than its "beds"
    And the field "hostels[0].occupied" equals the sum of "occupied" over "hostels[0].rooms"
    And every item of "hostels[0].rooms" has "occupied" no more than its "beds"

  @happy
  Scenario: The warden takes tonight's roll from the boarders on the books
    Given I am signed in as the WARDEN
    When I GET "/api/v1/hostel/rollcall?hostelId=czzhostel000000000001"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "dateKey" equals "{{today}}"
    And the field "entries" is a list of at least 1 item

  @happy
  Scenario: A guardian reads their boarder's room and tonight's roll
    Given I am signed in as the PARENT
    When I GET "/api/v1/family/hostel"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "allotment.hostelName" equals "ZZ Tilak House"
    And the field "tonight.dateKey" equals "{{today}}"

  @alternative
  Scenario: The boarders list and the menu are read by those they serve
    Given I am signed in as the WARDEN
    When I GET "/api/v1/hostel/boarders"
    Then the status is 200
    And the answer matches the catalog contract
    And every item of "items" has "hostelName" present
    Given I am signed in as the STUDENT
    When I GET "/api/v1/hostel/menu"
    Then the status is 200

  @negative
  Scenario: The warden cannot decide an expulsion; that is the head's
    Given I am signed in as the WARDEN
    When I POST "/api/v1/hostel/expulsions/zz-sweep-no-such-expulsion/decide" with:
      """
      { "decision": "UPHOLD" }
      """
    Then the status is 403

  @negative
  Scenario: An allotment with no boarder, room or bed is refused for its shape
    Given I am signed in as the WARDEN
    When I POST "/api/v1/hostel/allotments" with:
      """
      {}
      """
    Then the status is 422

  @negative
  Scenario: A teacher cannot read the boarders
    Given I am signed in as the TEACHER
    When I GET "/api/v1/hostel/boarders"
    Then the status is 403

  @negative
  Scenario: A school without the hostel module is answered MODULE_OFF
    Given I am signed in as the ADMIN zz.admin.b@zz.test
    When I GET "/api/v1/hostel/hostels"
    Then the status is 403
    And the error code is "MODULE_OFF"
