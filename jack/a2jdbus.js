const {Gio} = imports.gi;

const _a2jdbusInterface = `
<node name="/">
    <interface name="org.gna.home.a2jmidid.control">
    <method name="exit">
    </method>
    <method name="start">
    </method>
    <method name="stop">
    </method>
    <method name="is_started">
      <arg name="started" type="b" direction="out" />
    </method>
    <method name="get_jack_client_name">
      <arg name="jack_client_name" type="s" direction="out" />
    </method>
    <method name="map_alsa_to_jack_port">
      <arg name="alsa_client_id" type="u" direction="in" />
      <arg name="alsa_port_id" type="u" direction="in" />
      <arg name="map_playback" type="b" direction="in" />
      <arg name="jack_port_name" type="s" direction="out" />
    </method>
    <method name="map_jack_port_to_alsa">
      <arg name="jack_port_name" type="s" direction="in" />
      <arg name="alsa_client_id" type="u" direction="out" />
      <arg name="alsa_port_id" type="u" direction="out" />
      <arg name="alsa_client_name" type="s" direction="out" />
      <arg name="alsa_port_name" type="s" direction="out" />
    </method>
    <method name="set_hw_export">
      <arg name="hw_export" type="b" direction="in" />
    </method>
    <method name="get_hw_export">
      <arg name="hw_export" type="b" direction="out" />
    </method>
    <method name="set_disable_port_uniqueness">
      <arg name="disable_port_uniqueness" type="b" direction="in" />
    </method>
    <method name="get_disable_port_uniqueness">
      <arg name="disable_port_uniqueness" type="b" direction="out" />
    </method>
    <signal name="bridge_started">
    </signal>
    <signal name="bridge_stopped">
    </signal>
  </interface>
</node>
`;

const _A2jProxy = Gio.DBusProxy.makeProxyWrapper(_a2jdbusInterface);

var A2j = class A2j extends _A2jProxy {
    constructor() {
        super(
            Gio.DBus.session,
            'org.gna.home.a2jmidid',
            '/'
        );
    }
};
