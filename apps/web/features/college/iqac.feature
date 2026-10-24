@web @mobile @needs-server
Feature: IQAC and accreditation
  The IQAC keeps the NAAC cycle predicted from the college's own rows, its evidence, surveys, grievances,
  committees and filings; the insights name the cheapest steps to the next band and the simulator replays
  the figures in saved scenarios. Faculty keep their own records. Fixture cycle czziqaccycle000000001.

  @happy
  Scenario: The overview names the grade and the distance to the next band
    Given I am signed in as the IQAC
    When I GET "/api/v1/iqac/overview"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "cycle.grade" is present
    And the field "nextBand.distance" equals the field "nextBand.min" minus the field "cycle.cgpa" to 2 decimal places
    And the field "cycle.scoredCount" is at most 63

  @happy
  Scenario: The insights start from the same grade the overview predicts
    Given I am signed in as the IQAC
    When I GET "/api/v1/iqac/overview"
    And I remember the field "cycle.cgpa" as "cgpa"
    And I GET "/api/v1/iqac/insights"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "cgpa" equals {{cgpa}}
    And the field "paths" is a list of at least 1 item

  @alternative
  Scenario: A saved scenario is replayed by the simulator
    Given I am signed in as the IQAC
    When I GET "/api/v1/iqac/simulate?scenarioId=czziqacscen0000000001"
    Then the status is 200
    And the answer matches the catalog contract

  @alternative
  Scenario: A faculty member reads their own record for the accreditation files
    Given I am signed in as the FACULTY
    When I GET "/api/v1/iqac/faculty-records/mine"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "role" equals "FACULTY"

  @negative
  Scenario: A faculty member cannot read the IQAC's overview
    Given I am signed in as the FACULTY
    When I GET "/api/v1/iqac/overview"
    Then the status is 403

  @negative
  Scenario: The IQAC has no faculty record of its own to read there
    Given I am signed in as the IQAC
    When I GET "/api/v1/iqac/faculty-records/mine"
    Then the status is 403

  @negative
  Scenario: A survey with no title and no questions is refused for its shape
    Given I am signed in as the IQAC
    When I POST "/api/v1/iqac/surveys" with:
      """
      {}
      """
    Then the status is 422

  @negative
  Scenario: A college without the IQAC module is answered MODULE_OFF
    Given I am signed in as the ADMIN zz.cadmin.d@zz.test
    When I GET "/api/v1/iqac/overview"
    Then the status is 403
    And the error code is "MODULE_OFF"
