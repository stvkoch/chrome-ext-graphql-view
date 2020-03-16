import React from 'react';

import PanelItem from './panel-item';

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

export default function Panel({operations, onClick, onClickClean, operation}) {
  const [tabSelected, setTabSelected] = React.useState('all');
  const [filter, setFilter] = React.useState(null);

  let operationsFiltered =
    tabSelected === 'all'
      ? operations
      : operations.filter(op => match(op.type, tabSelected));
  operationsFiltered = filter
    ? operationsFiltered.filter(
        op =>
          toLw(op.operationName).indexOf(filter) !== -1 ||
          toLw(op.query).indexOf(filter) !== -1,
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
        {operationsFiltered.map(oper => (
          <PanelItem
            key={oper.id}
            onClick={onClick}
            operation={oper}
            selected={operation && oper && oper.id===operation.id}
          />
        ))}
      </div>

      <div className="panel-footer">
        <div className="panel-block">
          Total: {operationsFiltered.length}{' '}
          <a onClick={onClickClean} className=" go-right is-pulled-right">
            <i className="fas fa-ban" />
          </a>
        </div>
      </div>
    </nav>
  );
}
