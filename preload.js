const {writeFile,writeFileSync} =  require('fs');

utools.onPluginEnter(({
    code,
    type,
    payload,
    optional
}) => {
    //console.log('用户进入插件', code, type, payload);
        if (type == 'files') {
            window.app.ui.settings.imgPath = payload[0].path;
        } else if (type == 'img') {
            window.app.ui.settings.imgPath = payload;
        }
    });
utools.onPluginOut(() => {
    console.log('用户退出插件');
    //window.utools
});
utools.onPluginReady(() => {
    console.log('onPluginReady');
   
    // window.app = window.app || {
    //     writeFileSync : writeFileSync,
    // };
    //require('./ui/index');
    
});
window.app = window.app || {
    writeFile : writeFile,
    writeFileSync : writeFileSync,
};