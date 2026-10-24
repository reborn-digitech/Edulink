@web @needs-server
Feature: The expert application
  An outside mentor applies on the public form (no account is made); the operator reads the waiting
  applications with the document, and approves (an EXPERT account is invited) or declines; an approved expert
  keeps a profile, KYC and, while sessions are on, availability. The fixture keeps one PENDING application
  (zz.expert.applicant@zz.test) and the ZZ experts' profiles.

  @happy
  Scenario: The operator reads the waiting applications
    Given I am signed in as the OPERATOR
    When I GET "/api/v1/operator/expert-applications"
    Then the status is 200
    And the answer matches the catalog contract
    And some item of "items" has "email" equal to "zz.expert.applicant@zz.test"

  @happy
  Scenario: An expert reads their own profile and its impact
    Given I am signed in as the EXPERT
    When I GET "/api/v1/shared/expert/profile"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "profile.published" equals true
    And the field "impact.sessionsDone" is at most 1000

  @alternative
  Scenario: An expert with no KYC on file may submit it
    Given I am signed in as the EXPERT
    When I GET "/api/v1/expert/kyc"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "canSubmit" equals true

  @alternative
  Scenario: The operator approves an application and the applicant is invited as an expert
    # Not run: approving mints an account, and the campaign makes accounts only through the fixture scripts.
    Given the environment provides a run allowed to create accounts
    And I am signed in as the OPERATOR
    When I POST "/api/v1/operator/expert-applications/{{application}}/decide" with:
      """
      { "decision": "APPROVE" }
      """
    Then the status is 200

  @negative
  Scenario: An empty application names every field it needs
    Given I am signed out
    When I POST "/api/v1/public/expert-applications" with:
      """
      {}
      """
    Then the status is 422
    And the field "issues.name" is present
    And the field "issues.declaration" is present

  @negative
  Scenario: An application without the declaration is refused, and no account is made
    Given I am signed out
    When I POST "/api/v1/public/expert-applications" with:
      """
      { "name": "ZZ BDD Applicant", "email": "zz.bdd.applicant@zz.test", "phone": "+919876500099", "city": "Pune",
        "headline": "ZZ test applicant for the BDD layer", "specialisms": ["CODING"], "languages": ["en"],
        "yearsExperience": 5, "bio": "ZZ BDD Applicant is a ZZ test fixture. Nothing here describes a real person.",
        "offering": "SESSIONS", "declaration": false }
      """
    Then the status is 422
    And the field "ok" is absent or null

  @negative
  Scenario: A decision with no verdict is refused for its shape
    Given I am signed in as the OPERATOR
    When I POST "/api/v1/operator/expert-applications/zz-sweep-no-such-application/decide" with:
      """
      {}
      """
    Then the status is 422

  @negative
  Scenario: Only the operator reads applications
    Given I am signed in as the APPADMIN
    When I GET "/api/v1/operator/expert-applications"
    Then the status is 403
    Given I am signed in as the EXPERT
    When I GET "/api/v1/operator/expert-applications"
    Then the status is 403
