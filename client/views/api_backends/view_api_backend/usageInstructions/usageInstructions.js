Template.apiBackendUsageInstructions.created = function () {
  // Get reference to template instance
  var instance = this;

  // Create variable to hold API Umbrella base URL
  instance.apiUmbrellaBaseUrl = new ReactiveVar();

  // Get API Umbrella base URL from server
  Meteor.call("getApiUmbrellaBaseUrl", function (error, apiUmbrellaBaseUrl) {
    instance.apiUmbrellaBaseUrl.set(apiUmbrellaBaseUrl);
  });
};

Template.apiBackendUsageInstructions.helpers({
  apiUmbrellaBaseUrl: function () {
    // Get reference to template instance
    var instance = Template.instance();
    
    return "http://example.com";
  }
});
