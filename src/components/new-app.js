import React from 'react';
import ReactJson from 'react-json-view';
import GraphiQL from 'graphiql';
// import { GraphiQL } from 'graphiql';


import Layout from './layout';
import Columns from './columns';
import Column from './column';
import Panel from './panel';
import Content from './content';

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

let operations = [];


export default function NewApp() {
  const [tick, forceUpdate] = React.useState(0);
  const [operation, setOperation] = React.useState(null);

  React.useEffect(() => {
    return initListenersOperations(() => {
      forceUpdate(operations.length);
    });
  }, []);

  const onClickClean = React.useCallback(() => {
    operations = [];
    setOperation(null);
    forceUpdate(operations.length);
  }, [forceUpdate, setOperation]);

  return (
    <Layout>
      <Column isSidebar>
        <Panel
          tick={tick}
          operations={operations}
          onClick={setOperation}
          onClickClean={onClickClean}
        />
      </Column>
      <Column>
        <GqContent operation={operation} />
        {/* {operation && (
          <Columns>
            <Column scrollabled is-half>
              <div className={cl('rows')}>
                <div className="row">
                  <div className={cl('label')}>Query</div>
                  <code>{operation.query}</code>
                </div>
                <div className="row">
                  <div className={cl('label')}>Variables</div>
                  <ReactJson
                    collapsed={true}
                    theme="summerfruit"
                    displayDataTypes={false}
                    src={operation.variables}
                  />
                </div>
                <div className="row">
                  <div className={cl('label')}>Headers</div>
                  <ReactJson
                    collapsed={true}
                    theme="summerfruit"
                    displayDataTypes={false}
                    src={operation.headers}
                  />
                </div>
              </div>
            </Column>
            <Column borderLeft scrollabled is-column is-half is-flex>
              <Content operation={operation} />
            </Column>
          </Columns>
        )} */}
      </Column>
    </Layout>
  );
}

const GqContent = ({operation}) => {
  const [content, setContent] = React.useState(null);
  const [showContent, setShowContent] = React.useState(true);

  React.useEffect(() => {
    // setShowContent(operation.size < 2000);
  }, [operation]);

  React.useEffect(() => {
    if (!showContent) {
      return;
    }
    setContent(null);
    operation && operation.getContent(setContent);
  }, [showContent, operation]);

  // if (showContent && !content) return <div>Loading...</div>;

  const gqFetcher = React.useCallback((graphQLParams) => {
    return fetch(operation.url, {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(graphQLParams),
    }).then(response => response.json());
  }, [operation]);

  // return React.createElement(GraphiQL, {
  //   fetcher: gqFetcher,
  //   defaultVariableEditorOpen: true,
  // });
  return <GraphiQL response={JSON.parse(content)} query={operation.query} variables={operation.variables} operationName={operation.name} fetcher={gqFetcher} />
};


function parseHar(entry) {
  const {request, response} = entry;
  const gqRequest = graphqlRequest(request);
  if (!gqRequest) return null;

  const ast = gql`
    ${gqRequest.query}
  `;
  const name = ast.definitions
    .map(d => {
      const selectionName = get(d, 'selectionSet.selections')
        .map(s => get(s, 'name.value'))
        .join('+');
      const definitionName = get(d, 'name.value');
      return definitionName || selectionName;
    })
    .join('+');

  const type = get(ast, 'definitions')
    .map(d => d.operation)
    .join('+');

  const operation = {
    id: Math.random() * 100000000000000000,
    name,
    type,
    ...gqRequest,
    headers: request.headers,
    url: request.url,
    size: response.headersSize + response.bodySize,
    getContent: entry.getContent.bind(entry),
  };

  return operation;
}

const GRAPHQL_CHANNEL = 'gqRequest';

function graphqlRequest(request) {
  if (!(request.method === 'POST' && request.postData && request.postData.text))
    return null;
  try {
    const gqRequest = JSON.parse(request.postData.text);

    console.log('grapqhql Request', gqRequest);

    if ('query' in gqRequest) return gqRequest;
  } catch (error) {}
  return null;
}

function handleHarEntry(entry) {
  const operation = parseHar(entry);
  if (operation) publish(GRAPHQL_CHANNEL, operation);
}

subscribe(GRAPHQL_CHANNEL, entry => {
  operations.push(entry);
});

function initListenersOperations(subcribeCallback) {
  if (!(chrome && chrome.devtools)) return false;

  chrome.devtools.network.getHAR(function(result) {
    var entries = result.entries;

    if (!entries.length) {
      console.log(
        'Graphql extension suggests that you reload the page to track' +
          ' all graphql requests',
      );
    }

    subscribe(GRAPHQL_CHANNEL, entry => {
      subcribeCallback(entry);
    });

    for (var i = 0; i < entries.length; ++i) {
      handleHarEntry(entries[i]);
    }

    chrome.devtools.network.onRequestFinished.addListener(handleHarEntry);

    return () => unsubscribe(GRAPHQL_CHANNEL, subcribeCallback);
  });
}
