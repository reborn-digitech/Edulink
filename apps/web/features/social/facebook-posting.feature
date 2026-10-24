@web @needs-server
Feature: Facebook and Instagram posting
  A school's ADMIN connects the school's Facebook Page (and its linked Instagram professional account) once;
  a copy of each approved school-wide post is then sent there, queued, posted with a link, or failed with the
  reason, and a failed copy may be tried again. On the dev server no Meta app is configured, so nothing reaches
  Meta: ZZ Northgate's fixture Page holds a sealed fake key, and its first school-wide post carries one copy SENT to
  Facebook and one FAILED for Instagram. The sending itself (social:send against Graph) is mocked in
  tests/social.test.ts, not here. Nothing of this reaches the phone yet.

  @happy
  Scenario: The office sees the connected Page and that the platform has no Meta app configured
    Given I am signed in as the ADMIN
    When I GET "/api/v1/admin/social"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "configured" equals false
    And the field "connection.provider" equals "META"
    And the field "connection.needsReconnect" equals false

  @happy
  Scenario: A post's copies say where each went: a link for the sent one, the reason for the failed one
    Given I am signed in as the ADMIN
    And I find the school post that has copies on Facebook or Instagram as "post"
    When I GET "/api/v1/admin/social/posts?postId={{post}}"
    Then the status is 200
    And the answer matches the catalog contract
    And some item of "items" has "status" equal to "SENT"
    And some item of "items" has "status" equal to "FAILED"
    And every item of "items" with "sentAt" present has it no earlier than its "createdAt"

  @alternative
  Scenario: A new school-wide post is copied to the Page through Meta's Graph API
    # Not run: needs a configured Meta app (META_APP_ID) and a real Page; the send is mocked in the unit suite.
    Given the environment provides Meta's Graph API with a configured app
    And I am signed in as the ADMIN
    When I GET "/api/v1/admin/social"
    Then the field "configured" equals true

  @negative
  Scenario: A copy that has not failed is not tried again
    Given I am signed in as the ADMIN
    When I POST "/api/v1/admin/social/posts/zz-social-sent-northgate/retry"
    Then the status is 409
    And the error code is "CONFLICT"

  @negative
  Scenario: Disconnecting without naming the Page is refused, and the Page stays connected
    Given I am signed in as the ADMIN
    When I DELETE "/api/v1/admin/social" with:
      """
      {}
      """
    Then the status is 422
    When I GET "/api/v1/admin/social"
    Then the field "connection.pageId" equals "100000000000001"

  @negative
  Scenario: The head and the teachers do not hold the school's Page
    Given I am signed in as the PRINCIPAL
    When I GET "/api/v1/admin/social"
    Then the status is 403
    Given I am signed in as the TEACHER
    When I GET "/api/v1/admin/social"
    Then the status is 403

  @negative
  Scenario: Another school's office reads none of this school's copies
    Given I am signed in as the ADMIN
    And I find the school post that has copies on Facebook or Instagram as "post"
    Given I am signed in as the ADMIN zz.admin.b@zz.test
    When I GET "/api/v1/admin/social/posts?postId={{post}}"
    Then the status is one of 200, 403, 404
    And the answer does not contain "zz-social-sent-northgate"

  # Missing: the phone. The catalog's own note (src/lib/api-catalog/social.ts) says nothing of this reaches the
  # phone yet; the office cannot see or retry a post's copies from the app.
  @missing @mobile
  Scenario: The office follows a post's copies from the phone
    Then a phone screen under "staff, shared, college-office" mentions "/api/v1/admin/social"
