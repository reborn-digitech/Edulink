@web @mobile @needs-server
Feature: The operator's features and desks
  The operator (superuser) holds the platform's feature switches, the schools and colleges with their
  subscriptions and modules, the audit log, the jobs and the experts; the content team (app admin) holds the
  question bank's desk, moderation and the competitions desk. Neither is a school role: every school role is
  refused their doors. Nothing here switches anything: the scenarios read, and refuse.

  @happy
  Scenario: The operator reads every platform feature's switch with who changed it
    Given I am signed in as the OPERATOR
    When I GET "/api/v1/operator/features"
    Then the status is 200
    And the answer matches the catalog contract
    And some item of "features" has "code" equal to "ASSISTANT"
    And every item of "features" has "changedByName" present

  @happy
  Scenario: The operator's dashboard counts the schools it lists
    Given I am signed in as the OPERATOR
    When I GET "/api/v1/operator/dashboard"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "tiles.live" is at most 1000
    And the field "rows" is a list of at least 1 item

  @happy
  Scenario: The operator looks at one school, its subscription and its modules
    Given I am signed in as the ADMIN
    When I GET "/api/v1/me"
    And I remember the field "active.schoolId" as "school"
    Given I am signed in as the OPERATOR
    When I GET "/api/v1/operator/schools/{{school}}"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "subscription" is present
    When I GET "/api/v1/operator/schools/{{school}}/modules"
    Then the status is 200
    And the field "kind" equals "SCHOOL"

  @alternative
  Scenario: The bank desk's counts add up: served, taken down and held
    Given I am signed in as the APPADMIN
    When I GET "/api/v1/appadmin/quiz-review"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "total" equals the sum of the fields "served", "takenDown", "held"

  @alternative
  Scenario: The generation run is stopped while the campaign runs
    Given I am signed in as the APPADMIN
    When I GET "/api/v1/appadmin/quiz-jobs"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "current.state" does not equal "RUNNING"

  @alternative
  Scenario: The operator reads colleges by kind and the audit log
    Given I am signed in as the OPERATOR
    When I GET "/api/v1/operator/colleges"
    Then the status is 200
    And the answer matches the catalog contract
    When I GET "/api/v1/operator/audit"
    Then the status is 200
    And the field "total" is at least 1

  @negative
  Scenario: A school's office is refused the operator's doors
    Given I am signed in as the ADMIN
    When I GET "/api/v1/operator/dashboard"
    Then the status is 403
    When I GET "/api/v1/operator/features"
    Then the status is 403

  @negative
  Scenario: The content team is not the operator
    Given I am signed in as the APPADMIN
    When I GET "/api/v1/operator/features"
    Then the status is 403
    When I GET "/api/v1/operator/audit"
    Then the status is 403

  @negative
  Scenario: A switch for a feature that does not exist is refused
    Given I am signed in as the OPERATOR
    When I POST "/api/v1/operator/features/NO_SUCH_FEATURE" with:
      """
      { "enabled": true }
      """
    Then the status is one of 404, 422

  @negative
  Scenario: Signed out, the operator's doors answer 401
    Given I am signed out
    When I GET "/api/v1/operator/dashboard"
    Then the status is 401
