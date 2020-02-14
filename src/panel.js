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


let subscriptions = Object.create(null);

function subscribe(evt, func) {
  if (typeof func !== 'function') {
    throw 'Subscribers must be functions';
  }
  const oldSubscriptions = subscriptions[evt] || [];
  oldSubscriptions.push(func);
  subscriptions[evt] = oldSubscriptions;
}

function publish(evt) {
  let args = Array.prototype.slice.call(arguments, 1);
  const subFunctions = subscriptions[evt] || [];
  for (let i = 0; i < subFunctions.length; i++) {
    subFunctions[i].apply(null, args);
  }
}

function unsubscribe(evt, func) {
  const oldSubscriptions = subscriptions[evt] || [];
  const newSubscriptions = oldSubscriptions.filter(item => item !== func);
  subscriptions[evt] = newSubscriptions;
}

function cancel(evt) {
  delete subscriptions[evt];
}

function cl(...styleRules) {
  return styleRules.filter(Boolean).join(' ');
}
function toLw(str) {
  if (typeof str === 'string') return str.toLowerCase();
  return str;
}
function noop() {}
function Layout({children}) {
  return (
    <div className="max-height container is-fluid ">
      <Columns>{children}</Columns>
    </div>
  );
}
function Columns({children}) {
  return <div className={cl('columns')}>{children}</div>;
}
function Column({children, isSidebar, ...props}) {
  return (
    <div
      className={cl(
        'column',
        isSidebar && 'is-one-fifth',
        ...Object.keys(props),
      )}>
      {children}
    </div>
  );
}

function Panel({operations, onClick, onClickClean}) {
  const [tabSelected, setTabSelected] = React.useState('all');
  const [filter, setFilter] = React.useState(null);

  let operationsFiltered =
    tabSelected === 'all'
      ? operations
      : operations.filter(op => op.type === tabSelected);
  operationsFiltered = filter
    ? operationsFiltered.filter(
        op => toLw(op.operationName).indexOf(filter) !== -1,
      )
    : operationsFiltered;

  return (
    <nav className="panel">
      <div className="panel-header">
        <div className="panel-block">
          <p className="control has-icons-left">
            <input
              className="input"
              type="text"
              placeholder="Search"
              onChange={({target: {value}}) => setFilter(toLw(value))}
            />
            <span className="icon is-left">
              <i className="fas fa-search" aria-hidden="true" />
            </span>
          </p>
        </div>
        <p className="panel-tabs">
          <a
            className={cl(tabSelected === 'all' && 'is-active')}
            onClick={() => setTabSelected('all')}>
            All
          </a>
          <a
            className={cl(tabSelected === 'query' && 'is-active')}
            onClick={() => setTabSelected('query')}>
            Queries
          </a>
          <a
            className={cl(tabSelected === 'mutation' && 'is-active')}
            onClick={() => setTabSelected('mutation')}>
            Mutations
          </a>
        </p>
      </div>

      <div className="panel-content">
        {operationsFiltered.map(operation => (
          <PanelItem
            key={operation.id}
            onClick={onClick}
            operation={operation}
          />
        ))}
      </div>

      <div className="panel-footer">
        <div className="panel-block">Total: {operationsFiltered.length}  <a  onClick={onClickClean} className=" go-right is-pulled-right"><i className="fas fa-ban"/></a></div>
      </div>
    </nav>
  );
}

function PanelItem({operation, selected, onClick = noop}) {
  const isSelected = false;
  const operationIconQuery = operation.type !== 'mutation' && 'fa-file-alt';
  const operationIconMutation =
    operation.type === 'mutation' && 'fa-file-signature';

  return (
    <a
      className={`panel-block ${isSelected && 'is-active'}`}
      onClick={() => onClick(operation)}>
      <span className="panel-icon">
        <i
          className={`fas ${operationIconQuery} ${operationIconMutation}`}
          aria-hidden="true"
        />
      </span>
      {operation.name}
    </a>
  );
}

let operations = [];

function NewApp() {
  const [tick, forceUpdate] = React.useState(0);
  const [operation, setOperation] = React.useState(null);

  React.useEffect(() => {
    return initListenersOperations(() => {
      forceUpdate(operations.length);
    });
  }, []);

    const onClickClean = React.useCallback(()=> {
        operations = [];
        forceUpdate(operations.length);
    }, [forceUpdate]);

  return (
    <Layout>
      <Column isSidebar>
        <Panel tick={tick} operations={operations} onClick={setOperation} onClickClean={onClickClean} />
      </Column>
      <Column>
        {operation && (
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
            <Column borderLeft scrollabled is-half>
              <Content operation={operation} />
            </Column>
          </Columns>
        )}
      </Column>
    </Layout>
  );
}

const Content = ({operation}) => {
  const [content, setContent] = React.useState(null);

  React.useEffect(() => {
    setContent(null);
    operation && operation.getContent(setContent);
  }, [operation]);

  console.log('content', content);

  if (!content) return <div>Loading...</div>;

  return (
    <React.Fragment>
      <div className={cl('label')}>Content</div>
      <ReactJson
        theme="summerfruit"
        displayDataTypes={false}
        src={JSON.parse(content)}
      />
    </React.Fragment>
  );
};

ReactDOM.render(<NewApp />, document.getElementById('root'));

function parseHar(entry) {
  const {request, response} = entry;
  const gqRequest = graphqlRequest(request);
  if (!(gqRequest)) return null;

  const ast = gql`
  ${gqRequest.query}
  `;
  const name = ast.definitions.map(d =>  {
    const selectionName = get(d, 'selectionSet.selections').map(s=> get(s,'name.value')).join('+');
    const definitionName = get(d, 'name.value');
    console.log('map name', definitionName, selectionName);
    return definitionName || selectionName;
  }  ).join('+')
  
  console.log('query name', name);

  const type = get(ast, 'definitions').map(d=> d.operation).join('+');


  const operation = {
    id: Math.random() * 100000000000000000,
    name,
    type,
    ...gqRequest,
    headers: request.headers,
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
    if ('operationName' in gqRequest) return gqRequest;
  } catch (error) {}
  return null;
}

function handleHarEntry(entry) {
  const operation = parseHar(entry);
  console.log('publising', operation, entry);
  if (operation) publish(GRAPHQL_CHANNEL, operation);
}

subscribe(GRAPHQL_CHANNEL, entry => {
  console.log('received 1', entry);
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
