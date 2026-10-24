@web @mobile @needs-server
Feature: The clinical desk
  At a health-sciences college the clinical coordinator keeps sites (with their agreements), wards and postings
  by rotation; a supervising faculty member signs or returns a student's logbook entries; the student writes
  entries and submits them. ZZ Dhanvantari Nursing College: zz.faculty.d1 coordinates, zz.faculty.d2 supervises
  posting 1, zz.cstudent.d1 holds a SIGNED and a RETURNED entry.

  @happy
  Scenario: The coordinator's desk lists the sites with live agreements
    Given I am signed in as the FACULTY zz.faculty.d1@zz.test
    When I GET "/api/v1/duties/clinical"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "canManage" equals true
    And some item of "sites" has "id" equal to "czzclnsite00000000001"
    And every item of "sites" has "agreementLapsed" equal to false

  @happy
  Scenario: The supervising faculty member sees the postings they supervise
    Given I am signed in as the FACULTY zz.faculty.d2@zz.test
    When I GET "/api/v1/duties/clinical/supervising"
    Then the status is 200
    And the answer matches the catalog contract
    And some item of "postings" has "id" equal to "czzclnpost00000000001"

  @happy
  Scenario: A student's logbook: a signed entry carries its signature, a returned one its remark
    Given I am signed in as the STUDENT zz.cstudent.d1@zz.test
    When I GET "/api/v1/family/clinical"
    Then the status is 200
    And the answer matches the catalog contract
    And some item of "entries" has "state" equal to "SIGNED"
    And some item of "entries" has "state" equal to "RETURNED"
    And every SIGNED entry has a signing date and every RETURNED entry a remark

  @alternative
  Scenario: A college without health sciences is told the desk is not offered
    Given I am signed in as the FACULTY
    When I GET "/api/v1/duties/clinical/supervising"
    Then the status is 200
    And the field "offered" equals false

  @negative
  Scenario: A student cannot sign a logbook entry
    Given I am signed in as the STUDENT zz.cstudent.d1@zz.test
    When I POST "/api/v1/duties/clinical/logbook/czzclnentry0000000003/sign" with:
      """
      {}
      """
    Then the status is 403

  @negative
  Scenario: A posting with no division, ward or dates is refused for its shape
    Given I am signed in as the FACULTY zz.faculty.d1@zz.test
    When I POST "/api/v1/duties/clinical/postings" with:
      """
      {}
      """
    Then the status is 422

  @negative
  Scenario: Another college's faculty reach none of these rows
    Given I am signed in as the FACULTY
    When I POST "/api/v1/duties/clinical/logbook/czzclnentry0000000003/sign" with:
      """
      { "remark": "ZZ looks right" }
      """
    Then the status is one of 403, 404

  # Missing: the health-sciences councils' returns. docs/college.md, "Not built, per stream": every council return of
  # NMC, DCI and INC is not built; the clinical desk's postings and logbooks have no filing to feed.
  @missing
  Scenario: The college files the nursing council's return from its clinical rows
    Given I am signed in as the IQAC
    Then the catalog lists "GET /api/v1/iqac/council/inc"
    When I GET "/api/v1/iqac/council/inc?year=2025"
    Then the status is 200
