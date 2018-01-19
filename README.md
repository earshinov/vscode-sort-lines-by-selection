# Sort Lines by Selection

This extension allows you to sort lines based on the text selected in each line.  It is basically a port of the wonderful [Sort Lines By Selection][1] plugin for Sublime Text 3.

![Demo](doc/demo.gif)

The functionality is available via the Command Palette: Ctrl+Shift+P > "Sort Lines by Selection".  Additionally, you may wish to add a keybinding for it in your `keybindings.json` (Ctrl+Shift+P > "Preferences: Open Keyboard Shortcuts" > "edit keybindings.json") like this:

```json
{
    "key": "f10",
    "command": "sort-lines-by-selection.sortLinesBySelection"
}
```

Sorting is case-insensitive by default.  This behaviour can be overridden by specifying the `"case_sensitive"` argument:

```json
{
    "key": "f10",
    "command": "sort-lines-by-selection.sortLinesBySelection",
    "case_sensitive": true
}
```

The extension also supports applying a custom "morph" function to the selected strings before sorting.  Please see the [Sublime Text plugin][1] description for more details.  One thing to note is that in Visual Studio Code the morph function is written in JavaScript, as opposed to Python in Sublime Text.  As an example, here is a way to define a command that sorts lines by their selected strings **reversed**:

```json
{
    "key": "shift+f10",
    "command": "sort-lines-by-selection.sortLinesBySelection",
    "args": {
        "morph": "s.split('').reverse().join()"
    }
}
```

Enjoy!

[1]: https://packagecontrol.io/packages/Sort%20Lines%20By%20Selection
