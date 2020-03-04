// This one acts in the context of the panel in the Dev Tools
//
// Can use
// chrome.devtools.*
// chrome.extension.*

import React from 'react';
import ReactDOM from 'react-dom';
// import JSONTree from 'react-json-tree';
import ReactJson from 'react-json-view';
import get from 'lodash.get';
import gql from 'graphql-tag';

import {
  match,
  subscribe,
  publish,
  unsubscribe,
  cancel,
  cl,
  toLw,
  noop
} from '../utils';

export default function Content({operation}) {
  const [content, setContent] = React.useState(null);
  const [showContent, setShowContent] = React.useState(false);

  React.useEffect(() => {
    setShowContent(operation.size < 2000);
  }, [operation]);

  React.useEffect(() => {
    if (!showContent) {
      return;
    }
    setContent(null);
    operation && operation.getContent(setContent);
  }, [showContent, operation]);

  if (showContent && !content) return <div>Loading...</div>;

  return (
    <React.Fragment>
      <div className={cl('label')}>Content {operation.size / 1000}kb</div>
      <div className="content-button is-flex">
        {!showContent && (
          <button onClick={() => setShowContent(true)}>
            Show content with {operation.size / 1000}kb
          </button>
        )}
        {showContent && (
          <ReactJson
            collapsed={1}
            theme="summerfruit"
            displayDataTypes={false}
            src={JSON.parse(content)}
          />
        )}
      </div>
    </React.Fragment>
  );
};