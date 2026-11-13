@web @mobile @needs-server
Feature: Vidura's three modes
  Vidura is the assistant: "Using Shalaghar" (how the platform works, which page and which steps), "My records"
  (the person's own figures, counted from the pages they already see, with links to the rows cited) and
  "Learning" (topics from the books, naming the book, chapter and page under Sources), with "Vidura picks" the
  default. A pick sends only the next question that way and never gets past a refusal. A guardian may switch
  Vidura off for a child. The ASSISTANT feature is off on the dev database and its answers need the local model
  servers, which are the coordinator's; scenarios that need either are skipped for the environment.

  @happy
  Scenario: A pupil may pick all three modes
    Given the platform feature "ASSISTANT" is on
    And I am signed in as the STUDENT
    When I GET "/api/v1/assistant"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "modes" equals ["USING", "RECORDS", "LEARNING"]

  @happy
  Scenario: A question asked in "Using Shalaghar" is answered in that mode with the page to open
    Given the platform feature "ASSISTANT" is on
    And the environment provides the local model servers
    And I am signed in as the TEACHER
    When I POST "/api/v1/assistant/conversations" with:
      """
      { "language": "en" }
      """
    Then the status is 200
    Given I remember the field "id" as "conv"
    When I POST "/api/v1/assistant/conversations/{{conv}}/messages" with:
      """
      { "text": "How do I take today's register?", "mode": "USING" }
      """
    Then the status is 200
    And the answer matches the catalog contract
    And the field "answer.verdict" equals "ANSWERED"
    And the field "answer.chip" equals "USING"
    When I DELETE "/api/v1/assistant/conversations/{{conv}}"
    Then the status is 200

  @happy
  Scenario: A question asked in "My records" counts from the person's own rows and links them
    Given the platform feature "ASSISTANT" is on
    And the environment provides the local model servers
    And I am signed in as the STUDENT
    When I POST "/api/v1/assistant/conversations" with:
      """
      { "language": "en" }
      """
    Then the status is 200
    Given I remember the field "id" as "conv"
    When I POST "/api/v1/assistant/conversations/{{conv}}/messages" with:
      """
      { "text": "How many assignments are pending?", "mode": "RECORDS" }
      """
    Then the status is 200
    And the answer matches the catalog contract
    And the field "answer.verdict" equals "ANSWERED"
    And the field "answer.chip" equals "RECORDS"
    When I DELETE "/api/v1/assistant/conversations/{{conv}}"
    Then the status is 200

  @happy
  Scenario: A question asked in "Learning" names the book, chapter and page it read
    Given the platform feature "ASSISTANT" is on
    And the environment provides the local model servers
    And I am signed in as the STUDENT
    When I POST "/api/v1/assistant/conversations" with:
      """
      { "language": "en" }
      """
    Then the status is 200
    Given I remember the field "id" as "conv"
    When I POST "/api/v1/assistant/conversations/{{conv}}/messages" with:
      """
      { "text": "What is photosynthesis?", "mode": "LEARNING" }
      """
    Then the status is 200
    And the answer matches the catalog contract
    And the field "answer.verdict" equals "ANSWERED"
    And the field "answer.chip" equals "LEARNING"
    And the field "answer.citations" is a list of at least 1 item
    When I DELETE "/api/v1/assistant/conversations/{{conv}}"
    Then the status is 200

  @alternative
  Scenario: A driver has no tutor: "Learning" is not among their modes
    Given the platform feature "ASSISTANT" is on
    And I am signed in as the DRIVER
    When I GET "/api/v1/assistant"
    Then the status is 200
    And the field "modes" equals ["USING", "RECORDS"]

  @negative
  Scenario: While the operator has Vidura off, every role meets FEATURE_OFF
    Given the platform feature "ASSISTANT" is off
    And I am signed in as the STUDENT
    When I GET "/api/v1/assistant"
    Then the status is 404
    And the error code is "FEATURE_OFF"
    Given I am signed in as the PARENT
    When I GET "/api/v1/family/assistant"
    Then the status is 404
    And the error code is "FEATURE_OFF"
    Given I am signed in as the ADMIN
    When I GET "/api/v1/admin/assistant/usage"
    Then the status is 404

  @negative
  Scenario: A question with no text is refused for its shape
    Given the platform feature "ASSISTANT" is on
    And I am signed in as the STUDENT
    When I POST "/api/v1/assistant/conversations" with:
      """
      { "language": "en" }
      """
    Then the status is 200
    Given I remember the field "id" as "conv"
    When I POST "/api/v1/assistant/conversations/{{conv}}/messages" with:
      """
      { "mode": "USING" }
      """
    Then the status is 422
    When I DELETE "/api/v1/assistant/conversations/{{conv}}"
    Then the status is 200

  @negative
  Scenario: Only a guardian switches Vidura off for a child
    Given the platform feature "ASSISTANT" is on
    And I am signed in as the STUDENT
    When I POST "/api/v1/family/assistant/opt-out" with:
      """
      {}
      """
    Then the status is 403

  # Missing: the hosted model (Phase E of docs/plans/assistant.md is not built). With the owner's machine's model
  # servers down, Vidura has no endpoint to fall back to.
  @missing
  Scenario: Vidura answers from the hosted model when the local servers are down
    Given the platform feature "ASSISTANT" is on
    And I am signed in as the STUDENT
    When I POST "/api/v1/assistant/conversations" with:
      """
      { "language": "en" }
      """
    Then the status is 200
    Given I remember the field "id" as "conv"
    When I POST "/api/v1/assistant/conversations/{{conv}}/messages" with:
      """
      { "text": "How do I see my timetable?", "mode": "USING" }
      """
    Then the status is 200
    And the field "answer.verdict" equals "ANSWERED"
