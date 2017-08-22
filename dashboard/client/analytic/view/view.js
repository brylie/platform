/* Copyright 2017 Apinf Oy
 This file is covered by the EUPL license.
 You may obtain a copy of the licence at
 https://joinup.ec.europa.eu/community/eupl/og_page/european-union-public-licence-eupl-v11 */

// Meteor packages imports
import { Template } from 'meteor/templating';

// APInf imports
// eslint-disable-next-line max-len
import { arrowDirection, percentageValue, summaryComparing, calculateTrend } from '/dashboard/client/compare_indicating';

Template.apiAnalyticView.helpers({
  arrowDirection (parameter) {
    // Provide compared data
    return arrowDirection(parameter, this);
  },
  percentages (parameter) {
    // Provide compared data
    return percentageValue(parameter, this);
  },
  summaryComparing (parameter) {
    // Provide compared data
    return summaryComparing(parameter, this);
  },
  bucket () {
    const instance = Template.instance();
    // Get ES data
    const elasticsearchData = instance.data.elasticsearchData;

    const currentPeriodData = elasticsearchData.group_by_interval.buckets.currentPeriod;

    const requestNumber = currentPeriodData.doc_count;
    const responseTime = parseInt(currentPeriodData.response_time.values['95.0'], 10);
    const uniqueUsers = currentPeriodData.unique_users.buckets.length;

    const successCallsCount = currentPeriodData.response_status.buckets.success.doc_count;
    const redirectCallsCount = currentPeriodData.response_status.buckets.redirect.doc_count;
    const failCallsCount = currentPeriodData.response_status.buckets.fail.doc_count;
    const errorCallsCount = currentPeriodData.response_status.buckets.error.doc_count;

    const previousPeriodData = elasticsearchData.group_by_interval.buckets.previousPeriod;

    // Get the statistics comparing between previous and current periods
    const compareRequests = calculateTrend(previousPeriodData.doc_count, requestNumber);
    const compareResponse = calculateTrend(
      parseInt(previousPeriodData.response_time.values['95.0'], 10), responseTime
    );
    const compareUsers = calculateTrend(
      previousPeriodData.unique_users.buckets.length, uniqueUsers
    );

    return {
      id: instance.data.id,
      requestNumber,
      responseTime,
      uniqueUsers,
      successCallsCount,
      redirectCallsCount,
      failCallsCount,
      errorCallsCount,
      compareRequests,
      compareResponse,
      compareUsers,
      requestOverTime: currentPeriodData.requests_over_time.buckets,
    };
  },
  timelineData () {
    const instance = Template.instance();
    // Get ES data
    const elasticsearchData = instance.data.elasticsearchData;
    const currentPeriodData = elasticsearchData.group_by_interval.buckets.currentPeriod;

    return currentPeriodData.group_by_request_path.buckets;
  },
  mostFrequentUsers () {
    const instance = Template.instance();
    // Get ES data
    const elasticsearchData = instance.data.elasticsearchData;
    const currentPeriodData = elasticsearchData.group_by_interval.buckets.currentPeriod;

    return currentPeriodData.most_frequent_users.buckets;
  },
});
