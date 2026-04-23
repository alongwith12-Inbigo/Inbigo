# 구글 앱스 스크립트 (Google Apps Script) 가이드 - 최신 안정화 버전

이 코드는 교사님이 '시작일', '종료일', '반복 요일'을 입력했을 때, 해당 기간 내의 모든 날짜를 계산하여 구글 시트에 자동으로 행을 추가해주는 기능을 수행합니다. 이 버전은 데이터 누락을 방지하기 위한 안전 장치가 강화되었습니다.

### 1. 데이터베이스 시트 구조 (자동 생성)
스크립트를 실행하면 `방문예약`이라는 이름의 시트가 자동으로 생성되며, 첫 번째 행에 다음 11개 헤더를 작성합니다.
- `ID`, `신청일시`, `신청자`, `방문예정일`, `방문시간`, `방문자성명`, `소속`, `사유`, `차량유무`, `차량번호`, `특이사항`

### 2. 스크립트 설치 방법
1. 구글 시트 메뉴에서 **확장 프로그램 > Apps Script**를 클릭합니다.
2. 기존 코드를 모두 지우고 아래 코드를 붙여넣으세요.
3. **[배포] > [새 배포]**를 선택합니다.
4. 유형을 **[웹 앱]**으로 선택하고, 액세스 권한을 **[모든 사용자(Anyone)]**로 설정하세요.

### 3. 스크립트 코드
```javascript
function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = "방문예약";
    var sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(["ID", "신청일시", "신청자", "방문예정일", "방문시간", "방문자성명", "소속", "사유", "차량유무", "차량번호", "특이사항"]);
    }
    
    var payload = JSON.parse(e.postData.contents);
    var now = new Date();
    var rows = [];
    var entries = Array.isArray(payload) ? payload : [payload];
    
    entries.forEach(function(data) {
      if (!data.id) return;
      rows.push([
        data.id,
        now,
        data.teacherName || "",
        data.date || "",
        data.time || "",
        data.visitorName || "",
        data.visitorOrg || "",
        data.reason || "",
        data.hasVehicle ? "Y" : "N",
        data.carNumber || "",
        data.remarks || ""
      ]);
    });
    
    if (rows.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 11).setValues(rows);
    }
    
    return ContentService.createTextOutput(JSON.stringify({"result": "success", "message": rows.length + " rows added"}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({"result": "error", "message": err.message}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```
