# ePages 6 Themetools
Gulp taskrunner for ePages 6 theme-rendering.

_Install it with the [ePages 6 Yeoman Generator for Themes](https://github.com/ePages-rnd/generator-epages6-themes)_

## Gulp tasks including the following task

``watch-less``: Build css file with autoprefixer (insert a folder /less below /Style and create a file StyleExtension.less)

``watch-css``: Copies modified and new css files to the webroot via scp and autoreload the browser

``watch-js``: Copies modified and new js files to the webroot via scp and autoreload the browser

``brower-sync``: Starting webserver for autoreload

## Using Less

* after the installation, you can create a folder in the actual theme folder **[themename]/Style/less/**
* in this folder you must create a **StyleExtension.less** => this file will be automatically generate to StyleExtension.css
* **Warning: If you create a zero StyleExtension.less in a existing theme, your current StyleExtension.css will be override. Therefore, use less only for creating completely new theme-files**
