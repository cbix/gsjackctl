const {Gio, GObject} = imports.gi;

/* exported JackControl, JackConfigure, JackPatchbay, JackSession, JackTransport */

// dbus xml interface, retrieved by:
// dbus-send --session --dest=org.jackaudio.service --type=method_call --print-reply /org/jackaudio/Controller org.freedesktop.DBus.Introspectable.Introspect

const _jackdbusInterface = {
    jackControl: `
    <node>
      <interface name="org.jackaudio.JackControl">
        <method name="IsStarted">
          <arg name="started" type="b" direction="out" />
        </method>
        <method name="StartServer">
        </method>
        <method name="StopServer">
        </method>
        <method name="SwitchMaster">
        </method>
        <method name="GetLoad">
          <arg name="load" type="d" direction="out" />
        </method>
        <method name="GetXruns">
          <arg name="xruns_count" type="u" direction="out" />
        </method>
        <method name="GetSampleRate">
          <arg name="sample_rate" type="u" direction="out" />
        </method>
        <method name="GetLatency">
          <arg name="latency_ms" type="d" direction="out" />
        </method>
        <method name="GetBufferSize">
          <arg name="buffer_size_frames" type="u" direction="out" />
        </method>
        <method name="SetBufferSize">
          <arg name="buffer_size_frames" type="u" direction="in" />
        </method>
        <method name="IsRealtime">
          <arg name="realtime" type="b" direction="out" />
        </method>
        <method name="ResetXruns">
        </method>
        <method name="LoadInternal">
          <arg name="internal" type="s" direction="in" />
        </method>
        <method name="UnloadInternal">
          <arg name="internal" type="s" direction="in" />
        </method>
        <method name="AddSlaveDriver">
          <arg name="driver_name" type="s" direction="in" />
        </method>
        <method name="RemoveSlaveDriver">
          <arg name="driver_name" type="s" direction="in" />
        </method>
        <signal name="ServerStarted">
        </signal>
        <signal name="ServerStopped">
        </signal>
      </interface>
    </node>
  `,
    configure: `
    <node>
      <interface name="org.jackaudio.Configure">
        <method name="ReadContainer">
          <arg name="parent" type="as" direction="in" />
          <arg name="leaf" type="b" direction="out" />
          <arg name="children" type="as" direction="out" />
        </method>
        <method name="GetParametersInfo">
          <arg name="parent" type="as" direction="in" />
          <arg name="parameter_info_array" type="a(ysss)" direction="out" />
        </method>
        <method name="GetParameterInfo">
          <arg name="parameter" type="as" direction="in" />
          <arg name="parameter_info" type="(ysss)" direction="out" />
        </method>
        <method name="GetParameterConstraint">
          <arg name="parameter" type="as" direction="in" />
          <arg name="is_range" type="b" direction="out" />
          <arg name="is_strict" type="b" direction="out" />
          <arg name="is_fake_value" type="b" direction="out" />
          <arg name="values" type="a(vs)" direction="out" />
        </method>
        <method name="GetParameterValue">
          <arg name="parameter" type="as" direction="in" />
          <arg name="is_set" type="b" direction="out" />
          <arg name="default" type="v" direction="out" />
          <arg name="value" type="v" direction="out" />
        </method>
        <method name="SetParameterValue">
          <arg name="parameter" type="as" direction="in" />
          <arg name="value" type="v" direction="in" />
        </method>
        <method name="ResetParameterValue">
          <arg name="parameter" type="as" direction="in" />
        </method>
      </interface>
    </node>
  `,
    jackPatchbay: `
    <node>
      <interface name="org.jackaudio.JackPatchbay">
        <method name="GetAllPorts">
          <arg name="ports_list" type="as" direction="out" />
        </method>
        <method name="GetGraph">
          <arg name="known_graph_version" type="t" direction="in" />
          <arg name="current_graph_version" type="t" direction="out" />
          <arg name="clients_and_ports" type="a(tsa(tsuu))" direction="out" />
          <arg name="connections" type="a(tstststst)" direction="out" />
        </method>
        <method name="ConnectPortsByName">
          <arg name="client1_name" type="s" direction="in" />
          <arg name="port1_name" type="s" direction="in" />
          <arg name="client2_name" type="s" direction="in" />
          <arg name="port2_name" type="s" direction="in" />
        </method>
        <method name="ConnectPortsByID">
          <arg name="port1_id" type="t" direction="in" />
          <arg name="port2_id" type="t" direction="in" />
        </method>
        <method name="DisconnectPortsByName">
          <arg name="client1_name" type="s" direction="in" />
          <arg name="port1_name" type="s" direction="in" />
          <arg name="client2_name" type="s" direction="in" />
          <arg name="port2_name" type="s" direction="in" />
        </method>
        <method name="DisconnectPortsByID">
          <arg name="port1_id" type="t" direction="in" />
          <arg name="port2_id" type="t" direction="in" />
        </method>
        <method name="DisconnectPortsByConnectionID">
          <arg name="connection_id" type="t" direction="in" />
        </method>
        <method name="GetClientPID">
          <arg name="client_id" type="t" direction="in" />
          <arg name="process_id" type="x" direction="out" />
        </method>
        <signal name="GraphChanged">
          <arg name="new_graph_version" type="t" />
        </signal>
        <signal name="ClientAppeared">
          <arg name="new_graph_version" type="t" />
          <arg name="client_id" type="t" />
          <arg name="client_name" type="s" />
        </signal>
        <signal name="ClientDisappeared">
          <arg name="new_graph_version" type="t" />
          <arg name="client_id" type="t" />
          <arg name="client_name" type="s" />
        </signal>
        <signal name="PortAppeared">
          <arg name="new_graph_version" type="t" />
          <arg name="client_id" type="t" />
          <arg name="client_name" type="s" />
          <arg name="port_id" type="t" />
          <arg name="port_name" type="s" />
          <arg name="port_flags" type="u" />
          <arg name="port_type" type="u" />
        </signal>
        <signal name="PortDisappeared">
          <arg name="new_graph_version" type="t" />
          <arg name="client_id" type="t" />
          <arg name="client_name" type="s" />
          <arg name="port_id" type="t" />
          <arg name="port_name" type="s" />
        </signal>
        <signal name="PortsConnected">
          <arg name="new_graph_version" type="t" />
          <arg name="client1_id" type="t" />
          <arg name="client1_name" type="s" />
          <arg name="port1_id" type="t" />
          <arg name="port1_name" type="s" />
          <arg name="client2_id" type="t" />
          <arg name="client2_name" type="s" />
          <arg name="port2_id" type="t" />
          <arg name="port2_name" type="s" />
          <arg name="connection_id" type="t" />
        </signal>
        <signal name="PortsDisconnected">
          <arg name="new_graph_version" type="t" />
          <arg name="client1_id" type="t" />
          <arg name="client1_name" type="s" />
          <arg name="port1_id" type="t" />
          <arg name="port1_name" type="s" />
          <arg name="client2_id" type="t" />
          <arg name="client2_name" type="s" />
          <arg name="port2_id" type="t" />
          <arg name="port2_name" type="s" />
          <arg name="connection_id" type="t" />
        </signal>
        <signal name="PortRenamed">
          <arg name="new_graph_version" type="t" />
          <arg name="port_id" type="t" />
          <arg name="client_id" type="t" />
          <arg name="client_name" type="s" />
          <arg name="port_old_name" type="s" />
          <arg name="port_new_name" type="s" />
        </signal>
      </interface>
    </node>
  `,
    sessionManager: `
    <node>
      <interface name="org.jackaudio.SessionManager">
        <method name="Notify">
          <arg name="queue" type="b" direction="in" />
          <arg name="target" type="s" direction="in" />
          <arg name="type" type="u" direction="in" />
          <arg name="path" type="s" direction="in" />
          <arg name="result" type="a(sssu)" direction="out" />
        </method>
        <method name="GetUuidForClientName">
          <arg name="name" type="s" direction="in" />
          <arg name="uuid" type="s" direction="out" />
        </method>
        <method name="GetClientNameByUuid">
          <arg name="uuid" type="s" direction="in" />
          <arg name="name" type="s" direction="out" />
        </method>
        <method name="ReserveClientName">
          <arg name="name" type="s" direction="in" />
          <arg name="uuid" type="s" direction="in" />
        </method>
        <method name="HasSessionCallback">
          <arg name="client_name" type="s" direction="in" />
          <arg name="has_session_callback" type="b" direction="out" />
        </method>
        <method name="GetState">
          <arg name="type" type="u" direction="out" />
          <arg name="target" type="s" direction="out" />
        </method>
        <signal name="StateChanged">
          <arg name="type" type="u" />
          <arg name="target" type="s" />
        </signal>
      </interface>
    </node>
  `,
    transport: `
    <node>
      <interface name="org.jackaudio.JackTransport">
      </interface>
    </node>
  `,
};

const _JackdbusProxyControl = Gio.DBusProxy.makeProxyWrapper(_jackdbusInterface.jackControl);
const _JackdbusProxyConfigure = Gio.DBusProxy.makeProxyWrapper(_jackdbusInterface.configure);
const _JackdbusProxyPatchbay = Gio.DBusProxy.makeProxyWrapper(_jackdbusInterface.jackPatchbay);
const _JackdbusProxySession = Gio.DBusProxy.makeProxyWrapper(_jackdbusInterface.sessionManager);
const _JackdbusProxyTransport = Gio.DBusProxy.makeProxyWrapper(_jackdbusInterface.transport);

var JackControl = class JackControl extends _JackdbusProxyControl {
    constructor() {
        super(
            Gio.DBus.session,
            'org.jackaudio.service',
            '/org/jackaudio/Controller'
        );
    }
};

var JackConfigure = class JackConfigure extends _JackdbusProxyConfigure {
    constructor() {
        super(
            Gio.DBus.session,
            'org.jackaudio.service',
            '/org/jackaudio/Controller'
        );

        // stupid Gio.DBusProxy doesn't make this an actual class so we can't use regular class methods
        this._fullConfigurationTree = () => {
            const _traverseObjReducer = (acc, curr) => acc ? acc[curr] : undefined;

            const pathStack = [[]],
                tree = {};
            try {
                // basically a DFS through the configuration tree
                // probably quite heavy so maybe don't run this too often
                while (pathStack.length > 0) {
                    const path = pathStack.pop();
                    const [isLeaf, nodes] = this.ReadContainerSync(path);
                    const currentNode = path.reduce(_traverseObjReducer, tree);
                    if (!isLeaf) {
                        nodes.forEach(node => {
                            const newPath = path.concat(node);
                            // log(`push ${JSON.stringify(newPath)}`);
                            pathStack.push(newPath);
                            currentNode[node] = {};
                        });
                    } else {
                        nodes.forEach(node => {
                            const newPath = path.concat(node);
                            // TODO refactor this please
                            // TODO use real values instead of VariantType.print()
                            const [paramInfo] = this.GetParameterInfoSync(newPath);
                            const paramValue = this.GetParameterValueSync(newPath);
                            const paramConstraint = this.GetParameterConstraintSync(newPath);

                            currentNode[node] = {
                                name: paramInfo[1],
                                desc: paramInfo[2],
                                default: paramValue[2].print(true),
                                value: paramValue[2].print(true),
                                constraint: {
                                    isRange: paramConstraint[0],
                                    isStrict: paramConstraint[1],
                                    isFakeValue: paramConstraint[2],
                                    values: paramConstraint[3].map(v => ({
                                        key: v[0].print(true),
                                        name: v[1],
                                    })),
                                },
                            };
                        });
                    }
                }
            } catch (e) {
                logError(e, 'gsjackctl JackConfigure.fullConfigurationTree');
            }
            return tree;
        };
    }
};

var JackPatchbay = class JackPatchbay extends _JackdbusProxyPatchbay {
    constructor() {
        super(
            Gio.DBus.session,
            'org.jackaudio.service',
            '/org/jackaudio/Controller'
        );
    }
};

var JackSession = class JackSession extends _JackdbusProxySession {
    constructor() {
        super(
            Gio.DBus.session,
            'org.jackaudio.service',
            '/org/jackaudio/Controller'
        );
    }
};

var JackTransport = class JackTransport extends _JackdbusProxyTransport {
    constructor() {
        super(
            Gio.DBus.session,
            'org.jackaudio.service',
            '/org/jackaudio/Controller'
        );
    }
};

// vim: set sw=4 ts=4 :
