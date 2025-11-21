const React = require('react');

module.exports = ({ label, value, onChange, placeholder }) =>
  React.createElement('TagInput', { label, value, onChange, placeholder });
