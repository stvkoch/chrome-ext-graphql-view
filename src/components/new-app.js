import React from "react";
import get from "lodash.get";
import * as cuid from "cuid";
import { Provider, connect } from "react-redux";
import {
    setResponse,
    editQuery,
    editHeaders,
    editEndpoint,
    editVariables,
    getSelectedSessionIdFromRoot,
    getSelectedWorkspaceId,
    getSelectedSession,
    Playground,
    store
} from "graphql-playground-react";
import gql from "graphql-tag";

import Layout from "./layout";
import Columns from "./columns";
import Column from "./column";
import Panel from "./panel";
import Content from "./content";

import {
    match,
    subscribe,
    publish,
    unsubscribe,
    cancel,
    cl,
    toLw,
    noop
} from "../utils";

let operations = [];

export default function NewApp() {
    const [tick, forceUpdate] = React.useState(0);
    const [operation, setOperation] = React.useState(null);

    console.log("select op", operation);

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
        <Provider store={store}>
            <Layout>
                <Column isSidebar>
                    <Panel
                        tick={tick}
                        operations={operations}
                        onClick={setOperation}
                        onClickClean={onClickClean}
                        operation={operation}
                    />
                </Column>
                <Column>
                    <GqContent operation={operation} />
                </Column>
            </Layout>
        </Provider>
    );
}
const tabs = [];
const GqContent = connect(
    state => ({
        workspaceId: getSelectedWorkspaceId(state),
        sessionId: getSelectedSessionIdFromRoot(state),
        session: getSelectedSession(state)
    }),
    {
        setResponse,
        editQuery,
        editHeaders,
        editEndpoint,
        editVariables
    }
)(
    ({
        setResponse,
        editQuery,
        editHeaders,
        editEndpoint,
        editVariables,
        workspaceId,
        sessionId,
        session,
        operation
    }) => {
        const [content, setContent] = React.useState(null);
        const [showContent, setShowContent] = React.useState(true);

        React.useEffect(() => {
            // setShowContent(operation.size < 2000);
        }, [operation]);

        React.useEffect(() => {
            if (!showContent) {
                return;
            }
            operation && operation.getContent(setContent);
        }, [showContent, operation]);

        React.useEffect(() => {
            if (!content) return;
            console.log("actions", content, session, workspaceId, operation);
            const contentParsed = JSON.parse(content);
            const response = {
                date: JSON.stringify(contentParsed, null, 2),
                time: new Date(),
                resultID: cuid(),
                isSchemaError: false
            };

            setResponse(workspaceId, session.id, response);
            editQuery(operation.query);
            editHeaders(
                JSON.stringify(
                    operation.headers.reduce((ac, s) => ({
                        ...ac,
                        [s.name]: s.value
                    }))
                )
            );
            editEndpoint(operation.url);
            editVariables(JSON.stringify(operation.variables));
        }, [content]);

        // empty tab to populate with selected query
        const tabs = [
            {
                endpoint: "",
                query: "",
                name: "",
                variables: "",
                responses: [],
                headers: ""
            }
        ];
        return <Playground endpoint={null} tabs={tabs} />;
    }
);

function parseHar(entry) {
    const { request, response } = entry;
    const gqRequest = graphqlRequest(request);
    if (!gqRequest) return null;

    const ast = gql`
        ${gqRequest.query}
    `;
    const name = ast.definitions
        .map(d => {
            const selectionName = get(d, "selectionSet.selections")
                .map(s => get(s, "name.value"))
                .join("+");
            const definitionName = get(d, "name.value");
            return definitionName || selectionName;
        })
        .join("+");

    const type = get(ast, "definitions")
        .map(d => d.operation)
        .join("+");

    const operation = {
        id: Math.random() * 100000000000000000,
        name,
        type,
        ...gqRequest,
        headers: request.headers,
        url: request.url,
        size: response.headersSize + response.bodySize,
        getContent: entry.getContent.bind(entry)
    };

    return operation;
}

const GRAPHQL_CHANNEL = "gqRequest";

function graphqlRequest(request) {
    if (
        !(
            request.method === "POST" &&
            request.postData &&
            request.postData.text
        )
    )
        return null;
    try {
        const gqRequest = JSON.parse(request.postData.text);

        console.log("grapqhql Request", gqRequest);

        if ("query" in gqRequest) return gqRequest;
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
    if (!(chrome && chrome.devtools)) return;

    chrome.devtools.network.getHAR(function(result) {
        var entries = result.entries;

        if (!entries.length) {
            console.log(
                "Graphql extension suggests that you reload the page to track" +
                    " all graphql requests"
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
