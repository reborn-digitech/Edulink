@web @mobile @needs-server
Feature: Circulars and the feed
  The office publishes a circular to guardians (delivered on publish, read is "seen", an acknowledgement is asked
  where the circular says so) and reads its reach; everyone signed in reads the school's feed. The fixture's
  circular is "ZZ Annual day: consent and costumes", to the parents of ZZ Northgate, asking for an acknowledgement.

  Background:
    Given I am signed in as the ADMIN
    When I GET "/api/v1/office/circulars"
    And I remember the "postId" of the first item of "rows" whose "title" equals "ZZ Annual day: consent and costumes" as "circular"

  @happy
  Scenario: The office lists its circulars with their reach
    Then the status is 200
    And the answer matches the catalog contract
    And every item of "rows" has "publishedAt" present

  @happy
  Scenario: A guardian opens the circular and sees that it asks for an acknowledgement
    Given I am signed in as the PARENT
    When I GET "/api/v1/shared/bulletin/{{circular}}"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "audience" equals "PARENTS"
    And the field "requiresAck" equals true

  @happy
  Scenario: The reach report counts the guardian who acknowledged
    # zz.parent01 has acknowledged the fixture's circular (the post reads acked: true, ackCount 1).
    Given I am signed in as the PARENT
    When I GET "/api/v1/shared/bulletin/{{circular}}"
    Then the field "acked" equals true
    Given I am signed in as the ADMIN
    When I GET "/api/v1/shared/bulletin/{{circular}}/reach"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "totals.acked" is at least 1
    And the field "totals.total" is at least 1
    And the field "totals.acked" equals the sum of "acked" over "groups"

  @alternative
  Scenario: A circular's reach is told no more than it reached and acknowledged no more than seen
    When I GET "/api/v1/shared/bulletin/{{circular}}/reach"
    Then the field "totals.total" is at least 0
    And the field "totals.told" equals the sum of "told" over "groups"
    And the field "totals.seen" equals the sum of "seen" over "groups"

  @alternative
  Scenario: The school's feed lists posts newest first for a guardian
    Given I am signed in as the PARENT
    When I GET "/api/v1/shared/bulletin?limit=20"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "items" is a list of at least 1 item
    And the field "schoolName" equals "ZZ Northgate School"

  @alternative
  Scenario: A teacher's queue of held comments is theirs to read
    Given I am signed in as the TEACHER
    When I GET "/api/v1/shared/bulletin/comments/held"
    Then the status is 200
    And the answer matches the catalog contract

  @negative
  Scenario: A guardian cannot read a circular's reach report
    Given I am signed in as the PARENT
    When I GET "/api/v1/shared/bulletin/{{circular}}/reach"
    Then the status is 403

  @negative
  Scenario: A post with no title and no body is refused for its shape
    When I POST "/api/v1/shared/bulletin" with:
      """
      {}
      """
    Then the status is 422

  @negative
  Scenario: Another school's office cannot open this school's circular
    Given I am signed in as the ADMIN zz.admin.b@zz.test
    When I GET "/api/v1/shared/bulletin/{{circular}}"
    Then the status is one of 403, 404
    And the answer does not contain "consent and costumes"

  @negative
  Scenario: A teacher cannot send the guardians a reminder of the office's circular
    Given I am signed in as the TEACHER
    When I POST "/api/v1/shared/bulletin/{{circular}}/remind"
    Then the status is 403

  # Missing: the phone's permission-slip composer (docs/college.md, Untested: "Still not built: the phone's
  # permission-slip composer"). A guardian answers a slip on the phone; the office can only compose one on the web.
  @missing @mobile
  Scenario: The office composes a permission slip from the phone
    Then a phone screen under "staff, teacher, shared, college-office" mentions "consentQuestion"
