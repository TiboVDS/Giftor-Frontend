const React = require('react');

module.exports = ({ label, value, onChange, placeholder }) =>
  React.createElement('DatePicker', { label, value, onChange, placeholder });
