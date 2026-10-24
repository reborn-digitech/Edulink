@web @mobile @needs-server
Feature: Transport
  The office keeps routes, stops, buses, drivers and seats; the driver runs the day's trips from the phone
  (start, positions, boardings, end); a family follows their own child's bus. The fixture's rows are fixed ids
  (scripts/zz-transport.ts): route czztransportroutenorthgate01 and an ended trip czztransporttripendednorthg1.

  @happy
  Scenario: The office sees routes with their stops in the morning's order
    Given I am signed in as the ADMIN
    When I GET "/api/v1/admin/transport"
    Then the status is 200
    And the answer matches the catalog contract
    And some item of "routes" has "id" equal to "czztransportroutenorthgate01"
    And the field "routes[0].stops[0].order" equals 1

  @happy
  Scenario: The driver's day lists today's trips and asks for the location sentence once
    Given I am signed in as the DRIVER
    When I GET "/api/v1/transport/today"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "dateKey" equals "{{today}}"
    And the field "consent.needed" is present

  @happy
  Scenario: A guardian follows their child's bus, without the driver's details while the school hides them
    Given I am signed in as the ADMIN
    When I GET "/api/v1/admin/transport"
    Then the field "settings.showDriverToParents" equals false
    Given I am signed in as the PARENT
    When I GET "/api/v1/family/transport"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "seat.busRegistration" is present
    And the field "seat.driverName" equals null
    And the field "seat.driverPhone" equals null

  @alternative
  Scenario: Ending a trip that has ended answers it as it stands
    Given I am signed in as the DRIVER
    When I POST "/api/v1/transport/trips/czztransporttripendednorthg1/end"
    Then the status is 200
    And the field "endedAt" is present
    And I remember the field "endedAt" as "ended"
    When I POST "/api/v1/transport/trips/czztransporttripendednorthg1/end"
    Then the status is 200
    And the field "endedAt" equals "{{ended}}"

  @negative
  Scenario: An ended trip takes no more positions
    Given I am signed in as the DRIVER
    When I POST "/api/v1/transport/trips/czztransporttripendednorthg1/positions" with:
      """
      { "positions": [ { "lat": 18.5, "lng": 73.8, "at": "2026-10-23T02:00:00.000Z" } ] }
      """
    Then the status is one of 403, 409, 422

  @negative
  Scenario: A trip cannot be started with neither a location nor a reason
    Given I am signed in as the DRIVER
    When I POST "/api/v1/transport/trips/czztransporttripendednorthg1/start" with:
      """
      {}
      """
    Then the status is 422

  @negative
  Scenario: A guardian cannot follow another family's child
    Given I am signed in as the ADMIN
    When I GET "/api/v1/fees/dues"
    And I remember the "studentMembershipId" of the first item of "rows" whose "name" equals "ZZ Bhavna Bhatt" as "other"
    Given I am signed in as the PARENT
    When I GET "/api/v1/family/transport?childId={{other}}"
    Then the status is one of 403, 404
    And the answer does not contain "Bhavna"

  @negative
  Scenario: A teacher cannot read the office's transport
    Given I am signed in as the TEACHER
    When I GET "/api/v1/admin/transport"
    Then the status is 403

  @negative
  Scenario: The driver's doors are the driver's alone
    Given I am signed in as the TEACHER
    When I GET "/api/v1/transport/today"
    Then the status is 403
