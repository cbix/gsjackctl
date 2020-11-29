# gsjackctl – GNOME Shell JACK Control

_This GNOME Shell-extension is a work in progress._

## About
**gsjackctl** is a simple GNOME extension to control the JACK audio system. It works only with jack2 using jackdbus.

![gsjackctl screenshot](https://user-images.githubusercontent.com/1295945/100551911-1091e200-3284-11eb-8ebb-8425c923b692.png)

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
- [x] show status
  - [ ] reset xruns action
  - [ ] styling
- [ ] error notifications
- [ ] configuration
- [ ] configuration profiles
- [ ] transport (needs implementation of JackTransport dbus interface!)
- [ ] i18n

_TODO: open issues/PRs for these_

### future ideas
- responsive + touch-friendly gui
- pure gjs patchbay gui
- compatibility with QjackCtl presets
- detect + report common setup/beginner issues
