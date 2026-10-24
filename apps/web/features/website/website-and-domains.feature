@web @needs-server
Feature: The website builder and domains
  The office (or the head) edits the school's website as a draft, publishes it, keeps versions, answers the
  enquiries it brings, and connects the school's own domain. A site is public only on that domain once its DNS
  is verified (/sites/by-host/<host>); /sites/<slug> is the office's own preview. ZZ Northgate's fixture site is
  published with a draft ahead of it and the domain www.zz-northgate.test waiting for DNS.

  @happy
  Scenario: The office's summary adds up its enquiries and its visits
    Given I am signed in as the ADMIN
    When I GET "/api/v1/admin/site/summary"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "state" equals "PUBLISHED"
    And the field "visits.total" equals the sum of "count" over "visits.days"
    And the field "enquiries.newCount" equals the number of items of "enquiries.newest" whose "status" equals "NEW"
    And the field "ready.done" is at most 7

  @happy
  Scenario: The office edits a draft ahead of the published site and keeps its versions
    Given I am signed in as the ADMIN
    When I GET "/api/v1/admin/site"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "published" equals true
    And the field "unpublishedChanges" equals true
    When I GET "/api/v1/admin/site/versions"
    Then the status is 200
    And the field "versions" is a list of at least 1 item

  @happy
  Scenario: The office previews its own site at its slug
    Given I am signed in as the ADMIN
    When I GET "/sites/zz-northgate-school"
    Then the status is 200
    And the content type contains "text/html"
    And the answer contains "ZZ Northgate School"

  @alternative
  Scenario: The domain waits for DNS and says which records to set
    Given I am signed in as the PRINCIPAL
    When I GET "/api/v1/admin/site/domain"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "domain.domain" equals "www.zz-northgate.test"
    And the field "domain.status" equals "PENDING_DNS"
    And some item of "domain.records" has "type" equal to "CNAME"

  @negative
  Scenario: Nobody but the school's office sees the preview, and a domain not yet verified serves nothing
    Given I am signed out
    When I GET "/sites/zz-northgate-school"
    Then the status is 404
    When I GET "/sites/by-host/www.zz-northgate.test"
    Then the status is 404
    Given I am signed in as the TEACHER
    When I GET "/sites/zz-northgate-school"
    Then the status is 404

  @negative
  Scenario: A name that is not a domain is refused as invalid input
    # The catalog's emptyBodyStatus for this door is 422; a validation refusal is not a permission refusal.
    Given I am signed in as the ADMIN
    When I POST "/api/v1/admin/site/domain" with:
      """
      { "domain": "localhost" }
      """
    Then the status is 422

  @negative
  Scenario: A teacher cannot edit the website
    Given I am signed in as the TEACHER
    When I GET "/api/v1/admin/site"
    Then the status is 403

  @negative
  Scenario: A school without the website module is answered MODULE_OFF
    Given I am signed in as the ADMIN zz.admin.b@zz.test
    When I GET "/api/v1/admin/site"
    Then the status is 403
    And the error code is "MODULE_OFF"

  @alternative
  Scenario: A verified domain serves the published site to anyone
    # Not run: no fixture domain has passed a real DNS check on this machine.
    Given the environment provides a custom domain whose DNS has been verified
    And I am signed out
    When I GET "/sites/by-host/www.zz-northgate.test"
    Then the status is 200

  # Missing on the phone: building and changing the site is the web editor's (apps/mobile/src/screens/staff/website.tsx
  # reads the summary and links to the web); the phone neither edits, publishes nor connects a domain.
  @missing @mobile
  Scenario: The office publishes the website's draft from the phone
    Then a phone screen under "staff, shared, college-office" mentions "/api/v1/admin/site/publish"
