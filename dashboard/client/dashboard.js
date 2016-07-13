import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { ApiBackends } from '/apis/collection/backend';

import _ from 'lodash';
import moment from 'moment';

Template.dashboard.onCreated(function () {

  // Get reference to template instance
  const instance = this;

  // Handles ES data for charts
  instance.chartData = new ReactiveVar();

  instance.dateFormatMoment = 'DD.MM.YYYY';

  // TODO: rename variables & add comments
  instance.analyticsTimeframeStart = new ReactiveVar(moment().subtract(14, 'day'));
  instance.analyticsTimeframeEnd = new ReactiveVar(moment());

  const userId = Meteor.userId();

  if (Roles.userIsInRole(userId, ['admin'])) {

    // Subscribe to publication
    instance.subscribe('allApiBackends');
  } else {

    // Subscribe to publication
    instance.subscribe('myManagedApis');
  }

  instance.autorun(() => {
    if (instance.subscriptionsReady()) {

      // Get APIs managed by user
      const apis = ApiBackends.find().fetch();

      // Init varuable to keep elasticsearch sub-query
      let prefixesQuery = [];

      // Iterate through eacy API managed by user
      _.forEach(apis, (api) => {
        // Push query object to array
        prefixesQuery.push({
          wildcard: {
            request_path: {
              // Add '*' to partially match the url
              value: `${api.url_matches[0].frontend_prefix}*`
            }
          }
        });
      });

      // Construct parameters for elasticsearch
      let params = {
        size: 50000,
        body: {
          query: {
            filtered: {
              query: {
                bool: {
                  should: [
                    prefixesQuery
                  ]
                }
              },
              filter: {
                range: {
                  request_at: { }
                }
              }
            }
          },
          sort : [
            { request_at : { order : 'desc' }},
          ],
          fields: [
            'request_at',
            'response_status',
            'response_time',
            'request_ip_country',
            'request_ip',
            'request_path'
          ]
        }
      }

      // ******* Filtering by date *******
      const analyticsTimeframeStart = instance.analyticsTimeframeStart.get();
      const analyticsTimeframeEnd = instance.analyticsTimeframeEnd.get();

      if (analyticsTimeframeStart && analyticsTimeframeEnd) {

        params.body.query.filtered.filter.range.request_at.gte = analyticsTimeframeStart.valueOf();
        params.body.query.filtered.filter.range.request_at.lte = analyticsTimeframeEnd.valueOf();

      }
      // ******* End filtering by date *******

      // Fetch elasticsearch data
      Meteor.call('getElasticSearchData', params, (err, res) => {

        if (err) throw new Meteor.error(err);

        // Get list of items for analytics
        const hits = res.hits.hits;

        // Update reactive variable
        instance.chartData.set(hits);
      });
    }
  });

});

Template.dashboard.onRendered(function () {

  const instance = this;

  const analyticsTimeframeStart = instance.analyticsTimeframeStart.get();
  const analyticsTimeframeEnd = instance.analyticsTimeframeEnd.get();

  console.log(analyticsTimeframeStart, analyticsTimeframeEnd)

  const analyticsTimeframeStartFormatted = analyticsTimeframeStart.format(instance.dateFormatMoment);
  const analyticsTimeframeEndFormatted = analyticsTimeframeEnd.format(instance.dateFormatMoment);

  $('#analytics-timeframe-start').val(analyticsTimeframeStartFormatted);
  $('#analytics-timeframe-end').val(analyticsTimeframeEndFormatted);


});

Template.dashboard.events({
  'change #select-timeframe-form': function (event) {

    event.preventDefault();

    const instance = Template.instance();

    const analyticsTimeframeStartElementValue = $('#analytics-timeframe-start').val();
    const analyticsTimeframeEndElementValue = $('#analytics-timeframe-end').val();

    if (analyticsTimeframeStartElementValue && analyticsTimeframeEndElementValue) {

      const analyticsTimeframeStartMoment = moment(analyticsTimeframeStartElementValue, instance.dateFormatMoment);
      const analyticsTimeframeEndMoment = moment(analyticsTimeframeEndElementValue, instance.dateFormatMoment);

      console.log('***');
      console.log(JSON.stringify(analyticsTimeframeStartMoment) !== JSON.stringify(instance.analyticsTimeframeStart.get()));
      console.log(JSON.stringify(analyticsTimeframeEndMoment) !== JSON.stringify(instance.analyticsTimeframeEnd.get()));
      // console.log(JSON.stringify(analyticsTimeframeEndMoment), JSON.stringify(instance.analyticsTimeframeEnd.get()));
      console.log('diff', analyticsTimeframeEndMoment.diff(moment(), 'days') <= 0);

      if ((JSON.stringify(analyticsTimeframeStartMoment) !== JSON.stringify(instance.analyticsTimeframeStart.get())) ||
      ((JSON.stringify(analyticsTimeframeEndMoment) !== JSON.stringify(instance.analyticsTimeframeEnd.get())) &&
      (analyticsTimeframeEndMoment.diff(moment(), 'days') <= 0))) {

        console.log('changed');

        // Get reference to chart html elemets
        const chartElemets = $('#requestsOverTime-chart, #overviewChart-chart, #statusCodeCounts-chart, #responseTimeDistribution-chart');

        // Set loader
        chartElemets.addClass('loader');

        instance.analyticsTimeframeStart.set(analyticsTimeframeStartMoment);
        instance.analyticsTimeframeEnd.set(analyticsTimeframeEndMoment);
      }
    }
  }
});

Template.dashboard.helpers({
  chartData () {
    const instance = Template.instance();

    return instance.chartData.get();
  }
});
