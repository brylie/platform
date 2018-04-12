/* Copyright 2017 Apinf Oy
This file is covered by the EUPL license.
You may obtain a copy of the licence at
https://joinup.ec.europa.eu/community/eupl/og_page/european-union-public-licence-eupl-v11 */

// Meteor packages imports
import { Template } from 'meteor/templating';

// Meteor contributed packages imports
import { DocHead } from 'meteor/kadira:dochead';
import { Modal } from 'meteor/peppelg:bootstrap-3-modal';

// Collection imports
import Branding from '/apinf_packages/branding/collection';
import OrganizationLogo from '/apinf_packages/organizations/logo/collection/collection';

Template.organizationProfileHeader.onCreated(function () {
  const instance = this;

  instance.autorun(() => {
    // Get organization data using reactive way
    const organization = Template.currentData().organization;

    if (organization) {
      if (organization.organizationCoverFileId) {
        // Subscribe to Organization cover
        instance.subscribe('organizationCoverById', organization.organizationCoverFileId);
      }
      // Get organization data using reactive way
      if (organization && organization.organizationLogoFileId) {
        // Subscribe to current Organization logo
        instance.subscribe('currentOrganizationLogo', organization.organizationLogoFileId);
      }
      const branding = Branding.findOne();
      // Check if Branding collection and siteTitle are available
      if (branding && branding.siteTitle) {
        // Set the page title
        DocHead.setTitle(`${branding.siteTitle} - ${organization.name}`);
      }
    }
  });
});

Template.organizationProfileHeader.onRendered(function () {
  // Get current url hash value
  const hashTabValue = location.hash.substr(1);

  // If url contain hash value
  if (hashTabValue) {
    // Show tab
    $(`.nav-tabs a[href='#${hashTabValue}']`).tab('show');
  }

  // Assign resumable browse to element
  OrganizationLogo.resumable.assignBrowse(this.$('#organization-file-browse'));
});

Template.organizationProfileHeader.events({
  'click #edit-organization': function (event, templateInstance) {
    // Get organization from template instance
    const organization = templateInstance.data.organization;

    // Show organization form modal
    Modal.show('organizationForm', { organization, formType: 'update' });
  },
  'click #nav-tabs li > a': (event) => {
    // Show hash value in url
    window.location = `${event.currentTarget.hash}`;
  },
  'click #connect-api': () => {
    // Get Organization from template instance
    const organization = Template.currentData().organization;

    // Check organization exist
    if (organization) {
      // Show modal with list of suggested apis and id of current organization
      Modal.show('connectApiToOrganizationModal', { organization });
    } else {
      // Otherwise show error
      const message = TAPi18n.__('organizationProfile_text_error');
      sAlert.error(message, { timeout: 'none' });
    }
  },
  'click [data-lifecycle]': (event) => {
    // Get value of data-lifecycle
    const selectedTag = event.currentTarget.dataset.lifecycle;
    // Set value in query parameter
    FlowRouter.setQueryParams({ lifecycle: selectedTag });
  },
});
