# gsjackctl – GNOME Shell JACK Control

_This GNOME Shell-extension is a work in progress._

## About
**gsjackctl** is a simple GNOME extension to control the JACK audio system. It works only with jack2 using jackdbus.

![gsjackctl screenshot](https://user-images.githubusercontent.com/1295945/100521408-c6393400-31a3-11eb-87b8-ebcd01a9bab8.png)

## Installation

Dev install:

```
git clone https://github.com/cbix/gsjackctl ~/.local/share/gnome-shell/extensions/gsjackctl@cbix.de
```

## Features
### 1.0 milestone

- [x] gjs jackdbus library exposing all available dbus interfaces
- [x] start/stop JACK
- [x] custom icon
- [ ] new custom icon with status flags
- [ ] show status
  - [ ] xruns
  - [ ] load
  - [ ] rt
  - [ ] sr
  - [ ] latency
  - [ ] buffer/frames
  - [ ] interface/driver
- [ ] error notifications
- [ ] configuration
- [ ] configuration profiles
- [ ] transport (needs implementation of JackTransport dbus interface!)

### future ideas
- responsive + touch-friendly gui
- pure gjs patchbay gui
- compatibility with QjackCtl presets
- detect + report common setup/beginner issues
