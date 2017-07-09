function onOpen() {
  
  createMenu();
}

function createMenu() {
  
  ui.createMenu("Decrypt & Encrypt")
    .addItem("Edit your content", "startFunction")
    .addItem("Add new editor email", 'addNewEditorEmailFunction')
    .addToUi();
}


function startFunction() { 
  
  var thisDoc = DocumentApp.getActiveDocument();
  var docId   = thisDoc.getId();
  var docUrl  = thisDoc.getUrl();
  var docName = thisDoc.getName();
  var editors = thisDoc.getEditors();
  var viewers = thisDoc.getViewers();
  var activeUserEmail = Session.getActiveUser().getEmail();
  
  var docCount = retriveExistedDocId();
  //DocumentApp.getUi().alert(docCount);
  if ( isValidEditorEmail(activeUserEmail, docId) ) {
    
  } else {
    
  }
  
  if (docCount == 0) {
  
  }
  if (docCount > 0) {
    
    // 1. go to create sidebar DocumentApp.getUi().alert('Go to edit then save');
    
    showDialogBox('Edit then save');
    
    return;
  }
  
  if (editors.length == 1) {
    
  }
  else if (editors.length >= 1) {
    
  } else {
    
  }
  
  var docRowId         = insertDocId(docId, editors);
  
  var editorEmailRowId = addOwnerEmailToEditorEmails(docRowId, editors);
  
  var idAndNewKey      = getNewKeyFromDatabase();
  
  var sessionKeyRowid  = idAndNewKey[0];
  var newKey           = idAndNewKey[1];
   
  var start     = new Date();
  var encrypted = encrypt(theDefaultDummyText, newKey);
  var end       = new Date();
  
  recordEncryptingSpendTime(docRowId, sessionKeyRowid, 'e', (end - start), theDefaultDummyText.length);
  DocumentApp.getActiveDocument().setText(encrypted);
  markKeyIsStartUpStatus1(newKey);
  mapDocIdWithKey(docRowId, sessionKeyRowid);
  showDialogBox('Start to write content');
}

function createJdbcSSLConnection(dbUrl,  info) {

 var connection = Jdbc.getConnection( dbUrl, info );
  
  return connection;
}

function recordEncryptingSpendTime(docRowId, keyRowId, type, spendTime, letterLength) {
  
  var timeRowId;
  var conn = createJdbcSSLConnection(dbUrl,  info);
  
  var stmt = conn.createStatement();
  var date = getDateTimeInMySQLFormat();
  var sql = ' INSERT INTO times ( doc_id, sessionkey_id, type, spend_time, letter_length ) ' + 
            " values ( '" + docRowId + "', '" + keyRowId + "', '" + type  + "', '" + spendTime  + "', '" + letterLength + "' )";
  
  var count = stmt.executeUpdate(sql,1)
  var rs = stmt.getGeneratedKeys();
  
  rs.next();
  timeRowId = rs.getString(1);
  
  stmt.close();
  conn.close();
  
  return timeRowId;
}


function addNewEditorEmailFunction() { 
  
    var html = HtmlService
     .createTemplateFromFile('Share')
     .evaluate()
     .setTitle('Add new editor email')
     .setWidth(900)
     //.setSize("100%","100%")
     .setSandboxMode(HtmlService.SandboxMode.IFRAME);
  
  ui.showDialog(html);
}

function isValidEditorEmail(activeUserEmail, docId) { 
  
  var sql = " SELECT editoremails.email " +
            " FROM docs INNER JOIN editoremails " + 
            "      ON docs.id = editoremails.doc_id " +
            " WHERE docs.docid = '" + docId + "' " + 
            "       AND " +
            "       editoremails.email = '" + activeUserEmail + "' ";
  
  var connection = createJdbcSSLConnection(dbUrl,  info);
  var SQLstatement = connection.createStatement();
  var result = SQLstatement.executeQuery(sql);
  
  
  var isValid;
  if (result.next()) {
    
     isValid = true;
  } else {
     
     isValid = false;
  }
  
  result.close();
  SQLstatement.close();
  connection.close();  
  
  return isValid;
}
                                      
function showDialogBox(dialogBoxTitle) {
  
  var html = HtmlService
     //.createHtmlOutputFromFile('Site')
     .createTemplateFromFile('Site')
     .evaluate()
     .setTitle(dialogBoxTitle)
     .setWidth(1000) //old is 900
     //.setSize(width, height)
     .setHeight(900)
     .setSandboxMode(HtmlService.SandboxMode.IFRAME);
  //DocumentApp.getUi().alert(html);
  //DocumentApp.getUi().alert('Site');
  //DocumentApp.getUi().showModalDialog(html, 'Site');
  ui.showSidebar(html);
}
                                        
function getContent( ) {
  
  //DocumentApp.getUi().alert('test GetContent Function');
  
  var content;
  var docId     = DocumentApp.getActiveDocument().getId();
  var encrypted = DocumentApp.getActiveDocument().getText();
  
  //DocumentApp.getUi().alert(encrypted);
  
  var lastMappedKeyDatails;
  var docRowId;
  var sessionKeyRowId;
  var sessionKey;  // the last session key!
  var sessionKeyStartUpStatus;
  var start;
  var end;
  
  lastMappedKeyDatails    = getLastMappedKeyByDocIdV2(docId);
  docRowId                = lastMappedKeyDatails[0];
  sessionKeyRowId         = lastMappedKeyDatails[1];
  sessionKey              = lastMappedKeyDatails[2];
  sessionKeyStartUpStatus = lastMappedKeyDatails[3];
  
  //DocumentApp.getUi().alert(sessionKeyStartUpStatus);
  
  if (sessionKeyStartUpStatus == 1) {
    //DocumentApp.getUi().alert('decrypted');
    start   = new Date();
    content = decrypt(encrypted, sessionKey);
    end     = new Date();
    recordEncryptingSpendTime(docRowId, sessionKeyRowId, 'd', (end - start), content.length);
    
    markKeyFromStartUpStatus1To2(sessionKey);   // 2 means it will be in Edit action in the futher    
    
  } else if (sessionKeyStartUpStatus == 2) {
    //DocumentApp.getUi().alert('no decrypted');
    start   = new Date();
    content = decrypt(encrypted, sessionKey);
    end     = new Date();
    recordEncryptingSpendTime(docRowId, sessionKeyRowId, 'd', (end - start), content.length);
    
    //var x = recordEncryptingSpendTime(docRowId, sessionKeyRowId, 'd', (end - start), content.length);
    //DocumentApp.getUi().alert(start);
    //DocumentApp.getUi().alert(content);
    //DocumentApp.getUi().alert(end);
    //DocumentApp.getUi().alert(x);
    
  } else {    
    //DocumentApp.getUi().alert('error');
    content = "Illical error, because oldStartUpStatus = " + oldStartUpStatus;
  }
  //DocumentApp.getUi().alert('content: ' + content);
  return content;
}

function markKeyFromStartUpStatus1To2(oldKey) {
  
  var conn = createJdbcSSLConnection(dbUrl,  info);
  var date = getDateTimeInMySQLFormat();
  var stmt = conn.prepareStatement( 'UPDATE sessionkeys SET start_up = 2 WHERE `key` = ? AND start_up = 1 ' );
  stmt.setString(1, oldKey);
  stmt.execute();
  
  stmt.close();
  conn.close();
}


function getKeyWithStartUpStatus2ByDocId(docId) {
  
  var connection = createJdbcSSLConnection(dbUrl,  info);
  
  var SQLstatement = connection.createStatement();
  
  var sql = " SELECT   sessionkeys.`key`, sessionkeys.start_up " +
            " FROM     docs " + 
            "          INNER JOIN mapping ON docs.id = mapping.doc_id " + 
            "          INNER JOIN sessionkeys ON sessionkeys.id = mapping.sessionkey_id " + 
            " WHERE    docs.docid = '" + docId + "' AND sessionkeys.start_up = 2 " +
            " ORDER BY mapping.map_date DESC " + 
            " LIMIT    1 " ;

  var result = SQLstatement.executeQuery(sql);
  
  result.next();
  var key           = result.getString(1);
  var startUpStatus = result.getInt(2);
  
  result.close();
  SQLstatement.close();
  connection.close();  
  
  return [key, startUpStatus];
}

function getLastMappedKeyByDocIdV2(docId) {
  
  var connection = createJdbcSSLConnection(dbUrl,  info);
  
  var SQLstatement = connection.createStatement();
  
  var sql = " SELECT docs.id, sessionkeys.id, sessionkeys.`key`, sessionkeys.start_up " + 
            " FROM   docs " + 
            "        INNER JOIN mapping ON docs.id = mapping.doc_id " +
            "        INNER JOIN sessionkeys ON sessionkeys.id = mapping.sessionkey_id " + 
            " WHERE  docs.docid = '" + docId + "' " +
            " ORDER BY  mapping.map_date DESC " + 
            " LIMIT 1 ";

  var result = SQLstatement.executeQuery(sql);
  
  result.next();
  var docRowId      = result.getInt(1);
  var sessionKeyId  = result.getInt(2);
  var sessionKey    = result.getString(3);
  var startUpStatus = result.getInt(4);
  
  result.close();
  SQLstatement.close();
  connection.close();  
  
  return [docRowId, sessionKeyId, sessionKey, startUpStatus];
}


function getKeyWitchStartUpStatus1ByDocId (docId) {
  
  var connection = createJdbcSSLConnection(dbUrl,  info);
  
  var SQLstatement = connection.createStatement();
  
  var sql = " SELECT sessionkeys.`key`, sessionkeys.start_up " + 
            " FROM docs INNER JOIN mapping ON docs.id = mapping.doc_id " + 
            "           INNER JOIN sessionkeys ON sessionkeys.id = mapping.sessionkey_id " +
            " WHERE docs.docid = '" + docId + "' AND sessionkeys.start_up = 1; ";
  
  var result = SQLstatement.executeQuery(sql);
  
  result.next();
  var key           = result.getString(1);
  var startUpStatus = result.getInt(2);
  
  result.close();
  SQLstatement.close();
  connection.close();  
  
  return [key, startUpStatus];
  
}

function savePlainText(plainText) {
    
  var docId     = DocumentApp.getActiveDocument().getId();
  var docRowId  = getDocRowIdByDocId(docId);
  var editors = DocumentApp.getActiveDocument().getEditors();
  var viewers = DocumentApp.getActiveDocument().getViewers();
  var activeUserEmail = Session.getActiveUser().getEmail();
  var effectiveUserEmail = Session.getEffectiveUser().getEmail();
  var oldKeyAndStatus = getKeyWithStartUpStatus2ByDocId(docId);
  var oldKey =       oldKeyAndStatus[0];
  var oldKeyStatus = oldKeyAndStatus[1];
  
  markKeyFromStartUpStatus2To3(oldKey);

  var sessionKeyRowIdAndNewKey = getNewKeyFromDatabase();
  var sessionKeyRowId = sessionKeyRowIdAndNewKey[0];
  var newKey          = sessionKeyRowIdAndNewKey[1];
  var startTime = new Date();
  var encrypted = encrypt(plainText, newKey);
  var endTime   = new Date();
  recordEncryptingSpendTime(docRowId, sessionKeyRowId, 'e', (endTime - startTime), plainText.length);
  
  mapDocIdWithKeyByEffectiveUserEmail(docRowId, sessionKeyRowId, effectiveUserEmail);
  
  markKeyFromStartUpStatusNullTo2(newKey);
  
  DocumentApp.getActiveDocument().setText(encrypted);

}

function getDocRowIdByDocId(docId) {
  
  var docRowId;
  
  var connection = createJdbcSSLConnection(dbUrl,  info);
  var SQLstatement = connection.createStatement();
  
  var sql = " SELECT id FROM docs where docid = '" + docId + "' ; ";
  
  var result = SQLstatement.executeQuery(sql);
  
  result.next();
  docRowId    = result.getInt('id');
  
  result.close();
  SQLstatement.close();
  connection.close();  
  
  return docRowId;
}

function retriveExistedDocId() {
  
  var docId = DocumentApp.getActiveDocument().getId();
  var connection = createJdbcSSLConnection(dbUrl,  info);
  var SQLstatement = connection.createStatement();
  var sql = " SELECT * FROM docs where docid = '" + docId + "' ; ";
  var result = SQLstatement.executeQuery(sql);
  
  var rowCount = 0;
  while( result.next() ) {
    var row_id    = result.getInt('id');
    var row_docid = result.getString('docid');
    
    rowCount++;
  }
  
  result.close();
  SQLstatement.close();
  connection.close();  
  return rowCount;
}

function getDateTimeInMySQLFormat() {
  var date = new Date();
  date = date.getUTCFullYear() + '-' +
        ('00' + (date.getUTCMonth()+1)).slice(-2) + '-' +
        ('00' + date.getUTCDate()).slice(-2) + ' ' + 
        ('00' + date.getUTCHours()).slice(-2) + ':' + 
        ('00' + date.getUTCMinutes()).slice(-2) + ':' + 
        ('00' + date.getUTCSeconds()).slice(-2);
  return date;
}

function insertDocId(docId, editors) {
  var docRowId;
  var conn = createJdbcSSLConnection(dbUrl,  info);
  var stmt = conn.createStatement();
  var date = getDateTimeInMySQLFormat();
  var sql = ' INSERT INTO docs (docid, created_at, owner_email) ' + 
            " values ( '" + docId + "', '" + date + "', '" + editors + "' )";
  var count = stmt.executeUpdate(sql,1)
  var rs = stmt.getGeneratedKeys();
  
  rs.next();
  docRowId = rs.getString(1);
  stmt.close();
  conn.close();
  return docRowId;
}

function addOwnerEmailToEditorEmails(docRowId, editors) {
  
  var editorEmailRowId;
  var conn = createJdbcSSLConnection(dbUrl,  info);

  var stmt = conn.createStatement();
  var date = getDateTimeInMySQLFormat();
  var sql = ' INSERT INTO editoremails ( doc_id, email, join_at ) ' + 
            " values ( '" + docRowId + "', '" + editors + "', '" + date + "' )";
  var count = stmt.executeUpdate(sql,1)
  var rs = stmt.getGeneratedKeys();
  
  rs.next();
  editorEmailRowId = rs.getString(1);
  stmt.close();
  conn.close();
  return editorEmailRowId;
}

function getNewKeyFromDatabase() {
  
  var id;
  var key;
  var conn = createJdbcSSLConnection(dbUrl,  info);

  var stmt = conn.createStatement();
  stmt.setMaxRows(10);
  
  var sql = " SELECT id, `key` " + 
            " FROM sessionkeys " + 
            " WHERE      used_at is NULL " + 
            "       AND start_up is NULL " + 
            " LIMIT 1 ";
  
  var results = stmt.executeQuery(sql);

  if (results.next()) {
      id  = results.getString(1);
      key = results.getString(2);
  }

  results.close();
  stmt.close();
  conn.close();
  
  return [id, key];
}


function markKeyFromStartUpStatus2To3(key) {
  
  var conn = createJdbcSSLConnection(dbUrl,  info);
  var expiredDate = getDateTimeInMySQLFormat();
  var sql = " UPDATE sessionkeys " + 
            " SET    start_up = 3, expired_date = '" + expiredDate + "' " + 
            " WHERE      `key` = ? " + 
            "        AND start_up = 2 ; ";
  var stmt = conn.prepareStatement( sql );
  stmt.setString(1, key);
  stmt.execute();
  stmt.close();
  conn.close();
}


function markKeyFromStartUpStatusNullTo2(key) {
  
  var conn = createJdbcSSLConnection(dbUrl,  info);
  var usedDate = getDateTimeInMySQLFormat();
  var sql = " UPDATE sessionkeys " + 
            " SET    start_up = 2 , used_at = '" + usedDate + "' " + 
            " WHERE      `key` = ? " +
            "        AND start_up IS NULL ";
  var stmt = conn.prepareStatement(sql);
  stmt.setString(1, key);
  stmt.execute();
  stmt.close();
  conn.close();
}

function markKeyIsStartUpStatus1(newKey) {

  
  var conn = createJdbcSSLConnection(dbUrl,  info);
  var date = getDateTimeInMySQLFormat();
  var stmt = conn.prepareStatement( 'UPDATE sessionkeys SET used_at = ? , start_up = 1 WHERE `key` = ? ' );
  stmt.setString(1, date);
  stmt.setString(2, newKey);
  stmt.execute();
  
  stmt.close();
  conn.close();
}

function mapDocIdWithKey(docRowId, sessionkeyRowId) {
  
  var conn = createJdbcSSLConnection(dbUrl,  info);
  var stmt = conn.prepareStatement('INSERT INTO mapping '
                                + '(doc_id, sessionkey_id, map_date) values (?, ?, ?)');
  stmt.setString(1, docRowId);
  stmt.setString(2, sessionkeyRowId);
  stmt.setString(3, getDateTimeInMySQLFormat());
  stmt.execute();
  stmt.close();
  conn.close();
  
}

function mapDocIdWithKeyByEffectiveUserEmail(docRowId, sessionKeyRowId, effectiveUserEmail) {
  
  var mappingRowId;
  var conn = createJdbcSSLConnection(dbUrl,  info);
  var stmt = conn.createStatement();
  var date = getDateTimeInMySQLFormat();
  var sql = ' INSERT INTO mapping ' +
            ' (doc_id, sessionkey_id, map_date, editor_email) ' + 
            " values ( '" + docRowId + "', '" + sessionKeyRowId + "', '" + date + "', '" + effectiveUserEmail + "' )";
  
  var count = stmt.executeUpdate(sql,1)
  var rs = stmt.getGeneratedKeys();
  rs.next();
  mappingRowId = rs.getString(1);
  stmt.close();
  conn.close();
  return mappingRowId;
}

var CryptoJS=CryptoJS||function(h,r){var k={},l=k.lib={},n=function(){},f=l.Base={extend:function(a){n.prototype=this;var b=new n;a&&b.mixIn(a);b.hasOwnProperty("init")||(b.init=function(){b.$super.init.apply(this,arguments)});b.init.prototype=b;b.$super=this;return b},create:function(){var a=this.extend();a.init.apply(a,arguments);return a},init:function(){},mixIn:function(a){for(var b in a)a.hasOwnProperty(b)&&(this[b]=a[b]);a.hasOwnProperty("toString")&&(this.toString=a.toString)},clone:function(){return this.init.prototype.extend(this)}},
j=l.WordArray=f.extend({init:function(a,b){a=this.words=a||[];this.sigBytes=b!=r?b:4*a.length},toString:function(a){return(a||s).stringify(this)},concat:function(a){var b=this.words,d=a.words,c=this.sigBytes;a=a.sigBytes;this.clamp();if(c%4)for(var e=0;e<a;e++)b[c+e>>>2]|=(d[e>>>2]>>>24-8*(e%4)&255)<<24-8*((c+e)%4);else if(65535<d.length)for(e=0;e<a;e+=4)b[c+e>>>2]=d[e>>>2];else b.push.apply(b,d);this.sigBytes+=a;return this},clamp:function(){var a=this.words,b=this.sigBytes;a[b>>>2]&=4294967295<<
32-8*(b%4);a.length=h.ceil(b/4)},clone:function(){var a=f.clone.call(this);a.words=this.words.slice(0);return a},random:function(a){for(var b=[],d=0;d<a;d+=4)b.push(4294967296*h.random()|0);return new j.init(b,a)}}),m=k.enc={},s=m.Hex={stringify:function(a){var b=a.words;a=a.sigBytes;for(var d=[],c=0;c<a;c++){var e=b[c>>>2]>>>24-8*(c%4)&255;d.push((e>>>4).toString(16));d.push((e&15).toString(16))}return d.join("")},parse:function(a){for(var b=a.length,d=[],c=0;c<b;c+=2)d[c>>>3]|=parseInt(a.substr(c,
2),16)<<24-4*(c%8);return new j.init(d,b/2)}},p=m.Latin1={stringify:function(a){var b=a.words;a=a.sigBytes;for(var d=[],c=0;c<a;c++)d.push(String.fromCharCode(b[c>>>2]>>>24-8*(c%4)&255));return d.join("")},parse:function(a){for(var b=a.length,d=[],c=0;c<b;c++)d[c>>>2]|=(a.charCodeAt(c)&255)<<24-8*(c%4);return new j.init(d,b)}},t=m.Utf8={stringify:function(a){try{return decodeURIComponent(escape(p.stringify(a)))}catch(b){throw Error("Malformed UTF-8 data");}},parse:function(a){return p.parse(unescape(encodeURIComponent(a)))}},
q=l.BufferedBlockAlgorithm=f.extend({reset:function(){this._data=new j.init;this._nDataBytes=0},_append:function(a){"string"==typeof a&&(a=t.parse(a));this._data.concat(a);this._nDataBytes+=a.sigBytes},_process:function(a){var b=this._data,d=b.words,c=b.sigBytes,e=this.blockSize,f=c/(4*e),f=a?h.ceil(f):h.max((f|0)-this._minBufferSize,0);a=f*e;c=h.min(4*a,c);if(a){for(var g=0;g<a;g+=e)this._doProcessBlock(d,g);g=d.splice(0,a);b.sigBytes-=c}return new j.init(g,c)},clone:function(){var a=f.clone.call(this);
a._data=this._data.clone();return a},_minBufferSize:0});l.Hasher=q.extend({cfg:f.extend(),init:function(a){this.cfg=this.cfg.extend(a);this.reset()},reset:function(){q.reset.call(this);this._doReset()},update:function(a){this._append(a);this._process();return this},finalize:function(a){a&&this._append(a);return this._doFinalize()},blockSize:16,_createHelper:function(a){return function(b,d){return(new a.init(d)).finalize(b)}},_createHmacHelper:function(a){return function(b,d){return(new u.HMAC.init(a,
d)).finalize(b)}}});var u=k.algo={};return k}(Math);

var CryptoJS=CryptoJS||function(u,p){var d={},l=d.lib={},s=function(){},t=l.Base={extend:function(a){s.prototype=this;var c=new s;a&&c.mixIn(a);c.hasOwnProperty("init")||(c.init=function(){c.$super.init.apply(this,arguments)});c.init.prototype=c;c.$super=this;return c},create:function(){var a=this.extend();a.init.apply(a,arguments);return a},init:function(){},mixIn:function(a){for(var c in a)a.hasOwnProperty(c)&&(this[c]=a[c]);a.hasOwnProperty("toString")&&(this.toString=a.toString)},clone:function(){return this.init.prototype.extend(this)}},
r=l.WordArray=t.extend({init:function(a,c){a=this.words=a||[];this.sigBytes=c!=p?c:4*a.length},toString:function(a){return(a||v).stringify(this)},concat:function(a){var c=this.words,e=a.words,j=this.sigBytes;a=a.sigBytes;this.clamp();if(j%4)for(var k=0;k<a;k++)c[j+k>>>2]|=(e[k>>>2]>>>24-8*(k%4)&255)<<24-8*((j+k)%4);else if(65535<e.length)for(k=0;k<a;k+=4)c[j+k>>>2]=e[k>>>2];else c.push.apply(c,e);this.sigBytes+=a;return this},clamp:function(){var a=this.words,c=this.sigBytes;a[c>>>2]&=4294967295<<
32-8*(c%4);a.length=u.ceil(c/4)},clone:function(){var a=t.clone.call(this);a.words=this.words.slice(0);return a},random:function(a){for(var c=[],e=0;e<a;e+=4)c.push(4294967296*u.random()|0);return new r.init(c,a)}}),w=d.enc={},v=w.Hex={stringify:function(a){var c=a.words;a=a.sigBytes;for(var e=[],j=0;j<a;j++){var k=c[j>>>2]>>>24-8*(j%4)&255;e.push((k>>>4).toString(16));e.push((k&15).toString(16))}return e.join("")},parse:function(a){for(var c=a.length,e=[],j=0;j<c;j+=2)e[j>>>3]|=parseInt(a.substr(j,
2),16)<<24-4*(j%8);return new r.init(e,c/2)}},b=w.Latin1={stringify:function(a){var c=a.words;a=a.sigBytes;for(var e=[],j=0;j<a;j++)e.push(String.fromCharCode(c[j>>>2]>>>24-8*(j%4)&255));return e.join("")},parse:function(a){for(var c=a.length,e=[],j=0;j<c;j++)e[j>>>2]|=(a.charCodeAt(j)&255)<<24-8*(j%4);return new r.init(e,c)}},x=w.Utf8={stringify:function(a){try{return decodeURIComponent(escape(b.stringify(a)))}catch(c){throw Error("Malformed UTF-8 data");}},parse:function(a){return b.parse(unescape(encodeURIComponent(a)))}},
q=l.BufferedBlockAlgorithm=t.extend({reset:function(){this._data=new r.init;this._nDataBytes=0},_append:function(a){"string"==typeof a&&(a=x.parse(a));this._data.concat(a);this._nDataBytes+=a.sigBytes},_process:function(a){var c=this._data,e=c.words,j=c.sigBytes,k=this.blockSize,b=j/(4*k),b=a?u.ceil(b):u.max((b|0)-this._minBufferSize,0);a=b*k;j=u.min(4*a,j);if(a){for(var q=0;q<a;q+=k)this._doProcessBlock(e,q);q=e.splice(0,a);c.sigBytes-=j}return new r.init(q,j)},clone:function(){var a=t.clone.call(this);
a._data=this._data.clone();return a},_minBufferSize:0});l.Hasher=q.extend({cfg:t.extend(),init:function(a){this.cfg=this.cfg.extend(a);this.reset()},reset:function(){q.reset.call(this);this._doReset()},update:function(a){this._append(a);this._process();return this},finalize:function(a){a&&this._append(a);return this._doFinalize()},blockSize:16,_createHelper:function(a){return function(b,e){return(new a.init(e)).finalize(b)}},_createHmacHelper:function(a){return function(b,e){return(new n.HMAC.init(a,
e)).finalize(b)}}});var n=d.algo={};return d}(Math);
(function(){var u=CryptoJS,p=u.lib.WordArray;u.enc.Base64={stringify:function(d){var l=d.words,p=d.sigBytes,t=this._map;d.clamp();d=[];for(var r=0;r<p;r+=3)for(var w=(l[r>>>2]>>>24-8*(r%4)&255)<<16|(l[r+1>>>2]>>>24-8*((r+1)%4)&255)<<8|l[r+2>>>2]>>>24-8*((r+2)%4)&255,v=0;4>v&&r+0.75*v<p;v++)d.push(t.charAt(w>>>6*(3-v)&63));if(l=t.charAt(64))for(;d.length%4;)d.push(l);return d.join("")},parse:function(d){var l=d.length,s=this._map,t=s.charAt(64);t&&(t=d.indexOf(t),-1!=t&&(l=t));for(var t=[],r=0,w=0;w<
l;w++)if(w%4){var v=s.indexOf(d.charAt(w-1))<<2*(w%4),b=s.indexOf(d.charAt(w))>>>6-2*(w%4);t[r>>>2]|=(v|b)<<24-8*(r%4);r++}return p.create(t,r)},_map:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="}})();
(function(u){function p(b,n,a,c,e,j,k){b=b+(n&a|~n&c)+e+k;return(b<<j|b>>>32-j)+n}function d(b,n,a,c,e,j,k){b=b+(n&c|a&~c)+e+k;return(b<<j|b>>>32-j)+n}function l(b,n,a,c,e,j,k){b=b+(n^a^c)+e+k;return(b<<j|b>>>32-j)+n}function s(b,n,a,c,e,j,k){b=b+(a^(n|~c))+e+k;return(b<<j|b>>>32-j)+n}for(var t=CryptoJS,r=t.lib,w=r.WordArray,v=r.Hasher,r=t.algo,b=[],x=0;64>x;x++)b[x]=4294967296*u.abs(u.sin(x+1))|0;r=r.MD5=v.extend({_doReset:function(){this._hash=new w.init([1732584193,4023233417,2562383102,271733878])},
_doProcessBlock:function(q,n){for(var a=0;16>a;a++){var c=n+a,e=q[c];q[c]=(e<<8|e>>>24)&16711935|(e<<24|e>>>8)&4278255360}var a=this._hash.words,c=q[n+0],e=q[n+1],j=q[n+2],k=q[n+3],z=q[n+4],r=q[n+5],t=q[n+6],w=q[n+7],v=q[n+8],A=q[n+9],B=q[n+10],C=q[n+11],u=q[n+12],D=q[n+13],E=q[n+14],x=q[n+15],f=a[0],m=a[1],g=a[2],h=a[3],f=p(f,m,g,h,c,7,b[0]),h=p(h,f,m,g,e,12,b[1]),g=p(g,h,f,m,j,17,b[2]),m=p(m,g,h,f,k,22,b[3]),f=p(f,m,g,h,z,7,b[4]),h=p(h,f,m,g,r,12,b[5]),g=p(g,h,f,m,t,17,b[6]),m=p(m,g,h,f,w,22,b[7]),
f=p(f,m,g,h,v,7,b[8]),h=p(h,f,m,g,A,12,b[9]),g=p(g,h,f,m,B,17,b[10]),m=p(m,g,h,f,C,22,b[11]),f=p(f,m,g,h,u,7,b[12]),h=p(h,f,m,g,D,12,b[13]),g=p(g,h,f,m,E,17,b[14]),m=p(m,g,h,f,x,22,b[15]),f=d(f,m,g,h,e,5,b[16]),h=d(h,f,m,g,t,9,b[17]),g=d(g,h,f,m,C,14,b[18]),m=d(m,g,h,f,c,20,b[19]),f=d(f,m,g,h,r,5,b[20]),h=d(h,f,m,g,B,9,b[21]),g=d(g,h,f,m,x,14,b[22]),m=d(m,g,h,f,z,20,b[23]),f=d(f,m,g,h,A,5,b[24]),h=d(h,f,m,g,E,9,b[25]),g=d(g,h,f,m,k,14,b[26]),m=d(m,g,h,f,v,20,b[27]),f=d(f,m,g,h,D,5,b[28]),h=d(h,f,
m,g,j,9,b[29]),g=d(g,h,f,m,w,14,b[30]),m=d(m,g,h,f,u,20,b[31]),f=l(f,m,g,h,r,4,b[32]),h=l(h,f,m,g,v,11,b[33]),g=l(g,h,f,m,C,16,b[34]),m=l(m,g,h,f,E,23,b[35]),f=l(f,m,g,h,e,4,b[36]),h=l(h,f,m,g,z,11,b[37]),g=l(g,h,f,m,w,16,b[38]),m=l(m,g,h,f,B,23,b[39]),f=l(f,m,g,h,D,4,b[40]),h=l(h,f,m,g,c,11,b[41]),g=l(g,h,f,m,k,16,b[42]),m=l(m,g,h,f,t,23,b[43]),f=l(f,m,g,h,A,4,b[44]),h=l(h,f,m,g,u,11,b[45]),g=l(g,h,f,m,x,16,b[46]),m=l(m,g,h,f,j,23,b[47]),f=s(f,m,g,h,c,6,b[48]),h=s(h,f,m,g,w,10,b[49]),g=s(g,h,f,m,
E,15,b[50]),m=s(m,g,h,f,r,21,b[51]),f=s(f,m,g,h,u,6,b[52]),h=s(h,f,m,g,k,10,b[53]),g=s(g,h,f,m,B,15,b[54]),m=s(m,g,h,f,e,21,b[55]),f=s(f,m,g,h,v,6,b[56]),h=s(h,f,m,g,x,10,b[57]),g=s(g,h,f,m,t,15,b[58]),m=s(m,g,h,f,D,21,b[59]),f=s(f,m,g,h,z,6,b[60]),h=s(h,f,m,g,C,10,b[61]),g=s(g,h,f,m,j,15,b[62]),m=s(m,g,h,f,A,21,b[63]);a[0]=a[0]+f|0;a[1]=a[1]+m|0;a[2]=a[2]+g|0;a[3]=a[3]+h|0},_doFinalize:function(){var b=this._data,n=b.words,a=8*this._nDataBytes,c=8*b.sigBytes;n[c>>>5]|=128<<24-c%32;var e=u.floor(a/
4294967296);n[(c+64>>>9<<4)+15]=(e<<8|e>>>24)&16711935|(e<<24|e>>>8)&4278255360;n[(c+64>>>9<<4)+14]=(a<<8|a>>>24)&16711935|(a<<24|a>>>8)&4278255360;b.sigBytes=4*(n.length+1);this._process();b=this._hash;n=b.words;for(a=0;4>a;a++)c=n[a],n[a]=(c<<8|c>>>24)&16711935|(c<<24|c>>>8)&4278255360;return b},clone:function(){var b=v.clone.call(this);b._hash=this._hash.clone();return b}});t.MD5=v._createHelper(r);t.HmacMD5=v._createHmacHelper(r)})(Math);
(function(){var u=CryptoJS,p=u.lib,d=p.Base,l=p.WordArray,p=u.algo,s=p.EvpKDF=d.extend({cfg:d.extend({keySize:4,hasher:p.MD5,iterations:1}),init:function(d){this.cfg=this.cfg.extend(d)},compute:function(d,r){for(var p=this.cfg,s=p.hasher.create(),b=l.create(),u=b.words,q=p.keySize,p=p.iterations;u.length<q;){n&&s.update(n);var n=s.update(d).finalize(r);s.reset();for(var a=1;a<p;a++)n=s.finalize(n),s.reset();b.concat(n)}b.sigBytes=4*q;return b}});u.EvpKDF=function(d,l,p){return s.create(p).compute(d,
l)}})();
CryptoJS.lib.Cipher||function(u){var p=CryptoJS,d=p.lib,l=d.Base,s=d.WordArray,t=d.BufferedBlockAlgorithm,r=p.enc.Base64,w=p.algo.EvpKDF,v=d.Cipher=t.extend({cfg:l.extend(),createEncryptor:function(e,a){return this.create(this._ENC_XFORM_MODE,e,a)},createDecryptor:function(e,a){return this.create(this._DEC_XFORM_MODE,e,a)},init:function(e,a,b){this.cfg=this.cfg.extend(b);this._xformMode=e;this._key=a;this.reset()},reset:function(){t.reset.call(this);this._doReset()},process:function(e){this._append(e);return this._process()},
finalize:function(e){e&&this._append(e);return this._doFinalize()},keySize:4,ivSize:4,_ENC_XFORM_MODE:1,_DEC_XFORM_MODE:2,_createHelper:function(e){return{encrypt:function(b,k,d){return("string"==typeof k?c:a).encrypt(e,b,k,d)},decrypt:function(b,k,d){return("string"==typeof k?c:a).decrypt(e,b,k,d)}}}});d.StreamCipher=v.extend({_doFinalize:function(){return this._process(!0)},blockSize:1});var b=p.mode={},x=function(e,a,b){var c=this._iv;c?this._iv=u:c=this._prevBlock;for(var d=0;d<b;d++)e[a+d]^=
c[d]},q=(d.BlockCipherMode=l.extend({createEncryptor:function(e,a){return this.Encryptor.create(e,a)},createDecryptor:function(e,a){return this.Decryptor.create(e,a)},init:function(e,a){this._cipher=e;this._iv=a}})).extend();q.Encryptor=q.extend({processBlock:function(e,a){var b=this._cipher,c=b.blockSize;x.call(this,e,a,c);b.encryptBlock(e,a);this._prevBlock=e.slice(a,a+c)}});q.Decryptor=q.extend({processBlock:function(e,a){var b=this._cipher,c=b.blockSize,d=e.slice(a,a+c);b.decryptBlock(e,a);x.call(this,
e,a,c);this._prevBlock=d}});b=b.CBC=q;q=(p.pad={}).Pkcs7={pad:function(a,b){for(var c=4*b,c=c-a.sigBytes%c,d=c<<24|c<<16|c<<8|c,l=[],n=0;n<c;n+=4)l.push(d);c=s.create(l,c);a.concat(c)},unpad:function(a){a.sigBytes-=a.words[a.sigBytes-1>>>2]&255}};d.BlockCipher=v.extend({cfg:v.cfg.extend({mode:b,padding:q}),reset:function(){v.reset.call(this);var a=this.cfg,b=a.iv,a=a.mode;if(this._xformMode==this._ENC_XFORM_MODE)var c=a.createEncryptor;else c=a.createDecryptor,this._minBufferSize=1;this._mode=c.call(a,
this,b&&b.words)},_doProcessBlock:function(a,b){this._mode.processBlock(a,b)},_doFinalize:function(){var a=this.cfg.padding;if(this._xformMode==this._ENC_XFORM_MODE){a.pad(this._data,this.blockSize);var b=this._process(!0)}else b=this._process(!0),a.unpad(b);return b},blockSize:4});var n=d.CipherParams=l.extend({init:function(a){this.mixIn(a)},toString:function(a){return(a||this.formatter).stringify(this)}}),b=(p.format={}).OpenSSL={stringify:function(a){var b=a.ciphertext;a=a.salt;return(a?s.create([1398893684,
1701076831]).concat(a).concat(b):b).toString(r)},parse:function(a){a=r.parse(a);var b=a.words;if(1398893684==b[0]&&1701076831==b[1]){var c=s.create(b.slice(2,4));b.splice(0,4);a.sigBytes-=16}return n.create({ciphertext:a,salt:c})}},a=d.SerializableCipher=l.extend({cfg:l.extend({format:b}),encrypt:function(a,b,c,d){d=this.cfg.extend(d);var l=a.createEncryptor(c,d);b=l.finalize(b);l=l.cfg;return n.create({ciphertext:b,key:c,iv:l.iv,algorithm:a,mode:l.mode,padding:l.padding,blockSize:a.blockSize,formatter:d.format})},
decrypt:function(a,b,c,d){d=this.cfg.extend(d);b=this._parse(b,d.format);return a.createDecryptor(c,d).finalize(b.ciphertext)},_parse:function(a,b){return"string"==typeof a?b.parse(a,this):a}}),p=(p.kdf={}).OpenSSL={execute:function(a,b,c,d){d||(d=s.random(8));a=w.create({keySize:b+c}).compute(a,d);c=s.create(a.words.slice(b),4*c);a.sigBytes=4*b;return n.create({key:a,iv:c,salt:d})}},c=d.PasswordBasedCipher=a.extend({cfg:a.cfg.extend({kdf:p}),encrypt:function(b,c,d,l){l=this.cfg.extend(l);d=l.kdf.execute(d,
b.keySize,b.ivSize);l.iv=d.iv;b=a.encrypt.call(this,b,c,d.key,l);b.mixIn(d);return b},decrypt:function(b,c,d,l){l=this.cfg.extend(l);c=this._parse(c,l.format);d=l.kdf.execute(d,b.keySize,b.ivSize,c.salt);l.iv=d.iv;return a.decrypt.call(this,b,c,d.key,l)}})}();
(function(){for(var u=CryptoJS,p=u.lib.BlockCipher,d=u.algo,l=[],s=[],t=[],r=[],w=[],v=[],b=[],x=[],q=[],n=[],a=[],c=0;256>c;c++)a[c]=128>c?c<<1:c<<1^283;for(var e=0,j=0,c=0;256>c;c++){var k=j^j<<1^j<<2^j<<3^j<<4,k=k>>>8^k&255^99;l[e]=k;s[k]=e;var z=a[e],F=a[z],G=a[F],y=257*a[k]^16843008*k;t[e]=y<<24|y>>>8;r[e]=y<<16|y>>>16;w[e]=y<<8|y>>>24;v[e]=y;y=16843009*G^65537*F^257*z^16843008*e;b[k]=y<<24|y>>>8;x[k]=y<<16|y>>>16;q[k]=y<<8|y>>>24;n[k]=y;e?(e=z^a[a[a[G^z]]],j^=a[a[j]]):e=j=1}var H=[0,1,2,4,8,
16,32,64,128,27,54],d=d.AES=p.extend({_doReset:function(){for(var a=this._key,c=a.words,d=a.sigBytes/4,a=4*((this._nRounds=d+6)+1),e=this._keySchedule=[],j=0;j<a;j++)if(j<d)e[j]=c[j];else{var k=e[j-1];j%d?6<d&&4==j%d&&(k=l[k>>>24]<<24|l[k>>>16&255]<<16|l[k>>>8&255]<<8|l[k&255]):(k=k<<8|k>>>24,k=l[k>>>24]<<24|l[k>>>16&255]<<16|l[k>>>8&255]<<8|l[k&255],k^=H[j/d|0]<<24);e[j]=e[j-d]^k}c=this._invKeySchedule=[];for(d=0;d<a;d++)j=a-d,k=d%4?e[j]:e[j-4],c[d]=4>d||4>=j?k:b[l[k>>>24]]^x[l[k>>>16&255]]^q[l[k>>>
8&255]]^n[l[k&255]]},encryptBlock:function(a,b){this._doCryptBlock(a,b,this._keySchedule,t,r,w,v,l)},decryptBlock:function(a,c){var d=a[c+1];a[c+1]=a[c+3];a[c+3]=d;this._doCryptBlock(a,c,this._invKeySchedule,b,x,q,n,s);d=a[c+1];a[c+1]=a[c+3];a[c+3]=d},_doCryptBlock:function(a,b,c,d,e,j,l,f){for(var m=this._nRounds,g=a[b]^c[0],h=a[b+1]^c[1],k=a[b+2]^c[2],n=a[b+3]^c[3],p=4,r=1;r<m;r++)var q=d[g>>>24]^e[h>>>16&255]^j[k>>>8&255]^l[n&255]^c[p++],s=d[h>>>24]^e[k>>>16&255]^j[n>>>8&255]^l[g&255]^c[p++],t=
d[k>>>24]^e[n>>>16&255]^j[g>>>8&255]^l[h&255]^c[p++],n=d[n>>>24]^e[g>>>16&255]^j[h>>>8&255]^l[k&255]^c[p++],g=q,h=s,k=t;q=(f[g>>>24]<<24|f[h>>>16&255]<<16|f[k>>>8&255]<<8|f[n&255])^c[p++];s=(f[h>>>24]<<24|f[k>>>16&255]<<16|f[n>>>8&255]<<8|f[g&255])^c[p++];t=(f[k>>>24]<<24|f[n>>>16&255]<<16|f[g>>>8&255]<<8|f[h&255])^c[p++];n=(f[n>>>24]<<24|f[g>>>16&255]<<16|f[h>>>8&255]<<8|f[k&255])^c[p++];a[b]=q;a[b+1]=s;a[b+2]=t;a[b+3]=n},keySize:8});u.AES=p._createHelper(d)})();

var CryptoJS=CryptoJS||function(e,m){var p={},j=p.lib={},l=function(){},f=j.Base={extend:function(a){l.prototype=this;var c=new l;a&&c.mixIn(a);c.hasOwnProperty("init")||(c.init=function(){c.$super.init.apply(this,arguments)});c.init.prototype=c;c.$super=this;return c},create:function(){var a=this.extend();a.init.apply(a,arguments);return a},init:function(){},mixIn:function(a){for(var c in a)a.hasOwnProperty(c)&&(this[c]=a[c]);a.hasOwnProperty("toString")&&(this.toString=a.toString)},clone:function(){return this.init.prototype.extend(this)}},
n=j.WordArray=f.extend({init:function(a,c){a=this.words=a||[];this.sigBytes=c!=m?c:4*a.length},toString:function(a){return(a||h).stringify(this)},concat:function(a){var c=this.words,q=a.words,d=this.sigBytes;a=a.sigBytes;this.clamp();if(d%4)for(var b=0;b<a;b++)c[d+b>>>2]|=(q[b>>>2]>>>24-8*(b%4)&255)<<24-8*((d+b)%4);else if(65535<q.length)for(b=0;b<a;b+=4)c[d+b>>>2]=q[b>>>2];else c.push.apply(c,q);this.sigBytes+=a;return this},clamp:function(){var a=this.words,c=this.sigBytes;a[c>>>2]&=4294967295<<
32-8*(c%4);a.length=e.ceil(c/4)},clone:function(){var a=f.clone.call(this);a.words=this.words.slice(0);return a},random:function(a){for(var c=[],b=0;b<a;b+=4)c.push(4294967296*e.random()|0);return new n.init(c,a)}}),b=p.enc={},h=b.Hex={stringify:function(a){var c=a.words;a=a.sigBytes;for(var b=[],d=0;d<a;d++){var f=c[d>>>2]>>>24-8*(d%4)&255;b.push((f>>>4).toString(16));b.push((f&15).toString(16))}return b.join("")},parse:function(a){for(var c=a.length,b=[],d=0;d<c;d+=2)b[d>>>3]|=parseInt(a.substr(d,
2),16)<<24-4*(d%8);return new n.init(b,c/2)}},g=b.Latin1={stringify:function(a){var c=a.words;a=a.sigBytes;for(var b=[],d=0;d<a;d++)b.push(String.fromCharCode(c[d>>>2]>>>24-8*(d%4)&255));return b.join("")},parse:function(a){for(var c=a.length,b=[],d=0;d<c;d++)b[d>>>2]|=(a.charCodeAt(d)&255)<<24-8*(d%4);return new n.init(b,c)}},r=b.Utf8={stringify:function(a){try{return decodeURIComponent(escape(g.stringify(a)))}catch(c){throw Error("Malformed UTF-8 data");}},parse:function(a){return g.parse(unescape(encodeURIComponent(a)))}},
k=j.BufferedBlockAlgorithm=f.extend({reset:function(){this._data=new n.init;this._nDataBytes=0},_append:function(a){"string"==typeof a&&(a=r.parse(a));this._data.concat(a);this._nDataBytes+=a.sigBytes},_process:function(a){var c=this._data,b=c.words,d=c.sigBytes,f=this.blockSize,h=d/(4*f),h=a?e.ceil(h):e.max((h|0)-this._minBufferSize,0);a=h*f;d=e.min(4*a,d);if(a){for(var g=0;g<a;g+=f)this._doProcessBlock(b,g);g=b.splice(0,a);c.sigBytes-=d}return new n.init(g,d)},clone:function(){var a=f.clone.call(this);
a._data=this._data.clone();return a},_minBufferSize:0});j.Hasher=k.extend({cfg:f.extend(),init:function(a){this.cfg=this.cfg.extend(a);this.reset()},reset:function(){k.reset.call(this);this._doReset()},update:function(a){this._append(a);this._process();return this},finalize:function(a){a&&this._append(a);return this._doFinalize()},blockSize:16,_createHelper:function(a){return function(c,b){return(new a.init(b)).finalize(c)}},_createHmacHelper:function(a){return function(b,f){return(new s.HMAC.init(a,
f)).finalize(b)}}});var s=p.algo={};return p}(Math);
(function(){var e=CryptoJS,m=e.lib,p=m.WordArray,j=m.Hasher,l=[],m=e.algo.SHA1=j.extend({_doReset:function(){this._hash=new p.init([1732584193,4023233417,2562383102,271733878,3285377520])},_doProcessBlock:function(f,n){for(var b=this._hash.words,h=b[0],g=b[1],e=b[2],k=b[3],j=b[4],a=0;80>a;a++){if(16>a)l[a]=f[n+a]|0;else{var c=l[a-3]^l[a-8]^l[a-14]^l[a-16];l[a]=c<<1|c>>>31}c=(h<<5|h>>>27)+j+l[a];c=20>a?c+((g&e|~g&k)+1518500249):40>a?c+((g^e^k)+1859775393):60>a?c+((g&e|g&k|e&k)-1894007588):c+((g^e^
k)-899497514);j=k;k=e;e=g<<30|g>>>2;g=h;h=c}b[0]=b[0]+h|0;b[1]=b[1]+g|0;b[2]=b[2]+e|0;b[3]=b[3]+k|0;b[4]=b[4]+j|0},_doFinalize:function(){var f=this._data,e=f.words,b=8*this._nDataBytes,h=8*f.sigBytes;e[h>>>5]|=128<<24-h%32;e[(h+64>>>9<<4)+14]=Math.floor(b/4294967296);e[(h+64>>>9<<4)+15]=b;f.sigBytes=4*e.length;this._process();return this._hash},clone:function(){var e=j.clone.call(this);e._hash=this._hash.clone();return e}});e.SHA1=j._createHelper(m);e.HmacSHA1=j._createHmacHelper(m)})();

(function(){var e=CryptoJS,f=e.lib.WordArray,e=e.enc;e.Utf16=e.Utf16BE={stringify:function(b){var d=b.words;b=b.sigBytes;for(var c=[],a=0;a<b;a+=2)c.push(String.fromCharCode(d[a>>>2]>>>16-8*(a%4)&65535));return c.join("")},parse:function(b){for(var d=b.length,c=[],a=0;a<d;a++)c[a>>>1]|=b.charCodeAt(a)<<16-16*(a%2);return f.create(c,2*d)}};e.Utf16LE={stringify:function(b){var d=b.words;b=b.sigBytes;for(var c=[],a=0;a<b;a+=2)c.push(String.fromCharCode((d[a>>>2]>>>16-8*(a%4)&65535)<<8&4278255360|(d[a>>>
2]>>>16-8*(a%4)&65535)>>>8&16711935));return c.join("")},parse:function(b){for(var d=b.length,c=[],a=0;a<d;a++){var e=c,g=a>>>1,j=e[g],h=b.charCodeAt(a)<<16-16*(a%2);e[g]=j|h<<8&4278255360|h>>>8&16711935}return f.create(c,2*d)}}})();

(function(){var h=CryptoJS,j=h.lib.WordArray;h.enc.Base64={stringify:function(b){var e=b.words,f=b.sigBytes,c=this._map;b.clamp();b=[];for(var a=0;a<f;a+=3)for(var d=(e[a>>>2]>>>24-8*(a%4)&255)<<16|(e[a+1>>>2]>>>24-8*((a+1)%4)&255)<<8|e[a+2>>>2]>>>24-8*((a+2)%4)&255,g=0;4>g&&a+0.75*g<f;g++)b.push(c.charAt(d>>>6*(3-g)&63));if(e=c.charAt(64))for(;b.length%4;)b.push(e);return b.join("")},parse:function(b){var e=b.length,f=this._map,c=f.charAt(64);c&&(c=b.indexOf(c),-1!=c&&(e=c));for(var c=[],a=0,d=0;d<
e;d++)if(d%4){var g=f.indexOf(b.charAt(d-1))<<2*(d%4),h=f.indexOf(b.charAt(d))>>>6-2*(d%4);c[a>>>2]|=(g|h)<<24-8*(a%4);a++}return j.create(c,a)},_map:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="}})();

var address = 'YourDB-IP';
var user    = 'YourDB-UserName';
var userPwd = 'YourDB-Password';
var db      = 'YourDB-Name';
var dbUrl   = 'jdbc:mysql://' + address + '/' + db + '?useSSL=true';

var ui      = DocumentApp.getUi();

var theDefaultDummyText = "This is a dummy text. you must change it to your content";


var _serverSslCertificate = '-----BEGIN CERTIFICATE-----\nYourSSL-Certificate-Line-1\nYourSSL-Certificate-Line-2\nYourSSL-Certificate-Line-3\nYourSSL-Certificate-Line-4\nYourSSL-Certificate-Line-5\nYourSSL-Certificate-Line-6\nYourSSL-Certificate-Line-7\nYourSSL-Certificate-Line-8\nYourSSL-Certificate-Line-9\nYourSSL-Certificate-Line-10\nYourSSL-Certificate-Line-11\nYourSSL-Certificate-Line-12\nYourSSL-Certificate-Line-13\nYourSSL-Certificate-Line-14\nYourSSL-Certificate-Line-15\nYourSSL-Certificate-Line-16\nYourSSL-Certificate-Line-17\nYourSSL-Certificate-Line-18\nYourSSL-Certificate-Line-19\nYourSSL-Certificate-Line-20\nYourSSL-Certificate-Line-21\nYourSSL-Certificate-Line-22\n-----END CERTIFICATE-----';

var _clientSslCertificate = '-----BEGIN CERTIFICATE-----\nYourclientSslCertificate-Line-1\nYourclientSslCertificate-Line-2\nYourclientSslCertificate-Line-3\nYourclientSslCertificate-Line-4\nYourclientSslCertificate-Line-5\nYourclientSslCertificate-Line-X\n-----END CERTIFICATE-----';   //See Full Example as above Line

var _clientSslKey = '-----BEGIN PRIVATE KEY-----\nYourclientSslKey-Line-1\nYourclientSslKey-Line-2\nYourclientSslKey-Line-X\n-----END PRIVATE KEY-----';

var useJDBCCompliantTimeZoneShift   = false;

var info = {
	password    : userPwd,
	user        : user,

	useJDBCCompliantTimeZoneShift :  useJDBCCompliantTimeZoneShift,                  
	_serverSslCertificate : _serverSslCertificate,
	_clientSslCertificate : _clientSslCertificate,
	_clientSslKey : _clientSslKey
};

function encrypt(plainText, key) {
  var encrypted;
  
  encrypted = CryptoJS.AES.encrypt( plainText, key);
  encrypted = encrypted + '';
  
  return encrypted;
}

function decrypt(encrypted, key) {
  var content;
  var decrypted;
  
  decrypted = CryptoJS.AES.decrypt(encrypted, key);
  content = CryptoJS.enc.Utf8.stringify(decrypted);
  
  return content;
}

function addNewEmail(newEditorEmail) {
  
  newEditorEmail       = newEditorEmail.trim();
  var addedSuccess     = false;
  var editorEmailRowId = -1;
  
  var docId            = DocumentApp.getActiveDocument().getId();
  var activeUserEmail  = Session.getActiveUser().getEmail();
  
  if ( isValidEditorEmail(activeUserEmail, docId) ) {
    
  } else {
    
    return addedSuccess;
  }
  
  var docRowIdAndEmailBoolean = getExistedEditorEmailBy(docId, newEditorEmail);
  var docRowId = docRowIdAndEmailBoolean[0];
  var existedEmailBoolean = docRowIdAndEmailBoolean[1];
  
  if ( existedEmailBoolean == true ) {
    
    return addedSuccess;
    
  } else if ( existedEmailBoolean == false ) {
    
    editorEmailRowId = addEditorEmailToEditorEmailTableBy(docRowId, newEditorEmail);
  } else {
    
  }
  
  if (editorEmailRowId != -1) {
    addedSuccess = true;
  }
  
  return addedSuccess;

function getExistedEditorEmailBy(docId, newEditorEmail) {
  
  var docRowId = getDocRowIdByDocId(docId);

   var sql2 = ' SELECT editoremails.email ' + 
              ' FROM   editoremails   ' + 
              ' WHERE       editoremails.doc_id = "' + docRowId + '" ' + 
              '        AND ' + 
              '             editoremails.email  = "' + newEditorEmail + '" ';
  
  var connection = createJdbcSSLConnection(dbUrl,  info);
  var SQLstatement = connection.createStatement();
  var result = SQLstatement.executeQuery(sql2);
  
  
  var existedEmailBoolean;
  if (result.next()) {
    
     existedEmailBoolean = true;
  } else {
     
     existedEmailBoolean = false;
  }
  
  result.close();
  SQLstatement.close();
  connection.close();  
  
  return [docRowId, existedEmailBoolean];
}

function addEditorEmailToEditorEmailTableBy(docRowId, newEditorEmail) {

  var editorEmailRowId;
  
  var conn = createJdbcSSLConnection(dbUrl,  info);
  var stmt = conn.createStatement();
  var date = getDateTimeInMySQLFormat();
  
  var sql = " INSERT INTO editoremails (doc_id, email, join_at ) " + 
            " values ( '" + docRowId + "', '" + newEditorEmail + "', '" + date + "' ) ";
  
  var count = stmt.executeUpdate(sql,1)
  var rs = stmt.getGeneratedKeys();
  
  rs.next();
  editorEmailRowId = rs.getString(1);
  stmt.close();
  conn.close();
  
  return editorEmailRowId;
  }
}  
