// <----------------------------------------------------------USTAWIENIA---------------------------------------------------------->
//BEST_SELLERY 


// wybierz numer "custom label" [0-4] - powinna być całkowicie wolna, bo powodje nadpisanie wszystkich wartości
// numer powinien być zgodny z plikeiem z Google spreadsheet - kolumna B1 = 'custom_label4'
var CUSTOM_LABEL_NR = '4';

// EXCEL
var SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/1dQa2TyWgXDFNBFo00abXCVdQdbsvisfL229kZykkEek/edit?usp=sharing';

// NAZWA CUSTOM LABEL
var LABEL_BESTSELLERS = 'bestseller_conversion_last_30d';

// DOLNY PRÓG KONWERSJI, po którym produkt jest uznawany za bestseller
var BESTSELLER_FLOOR = "50"

//KAMPANIA - nazwa lub wszystkie
var USE_CAMPAIGN_FILTER = true;
var FILTER_CAMPAIGN_NAME = ' AND campaign.name LIKE "PLA Smart" ';

// Enter time duration below. Possibilities:
// TODAY | YESTERDAY | LAST_7_DAYS | LAST_WEEK | LAST_BUSINESS_WEEK |
// THIS_MONTH | LAST_MONTH | LAST_14_DAYS | LAST_30_DAYS |
// THIS_WEEK_SUN_TODAY | THIS_WEEK_MON_TODAY | LAST_WEEK_SUN_SAT Currently
// default time duration is set to: LAST_30_DAYS
var TIME_DURATION = 'LAST_30_DAYS';

// Ilość przetwarzanych produktów
var COUNT_LIMIT = '100000';
// <----------------------------------------------------------USTAWIENIA_KONIEC---------------------------------------------------------->




// Tego nie zmieniamy
var FILTER_RAMPED_UP = 'segments.product_custom_attribute' + CUSTOM_LABEL_NR + ' = "' + LABEL_BESTSELLERS + '" ';
var FILTER_BESTSELLERS = `metrics.conversions > ${BESTSELLER_FLOOR}` ;

// Jesli jest true to uruchomione jest filtrowanie danych na podstawie jednej kampanii
// nazwę kampanii należy podać w "Twoja nazwa kampanii"



function main() {
  // Raportowanie: Filtr + nazwa pliku
  // do tego są potrzezbne zakłądki Report ALL, Report RAMPED_UP, Report LOW
  //getReport('metrics.clicks < 40', 'Report ALL');
  //getReport('segments.product_custom_attribute' + CUSTOM_LABEL_NR + ' = "' + LABEL_RAMPED_UP + '" ', 'Report RAMPED_UP');
  //getReport('segments.product_custom_attribute' + CUSTOM_LABEL_NR + ' = "' + LABEL_BESTSELLERS + '" ', 'Report LOW');

  
  Logger.log('Wszystkich oznaczonych produktów LABEL_BESTSELLERS z warunku FILTER_ALL');
	var productsAll       = getFilteredShoppingProducts(FILTER_BESTSELLERS, 'ALL');
}  
Logger.log('Wszystkich oznaczonych produktów LABEL_RAMPED_UP z warunku FILTER_RAMPED_UP');
	var productsRampedUp  = getFilteredShoppingProducts(FILTER_RAMPED_UP, 'Produkty RAMPED_UP');
	var products = productsAll.concat(productsRampedUp);
	pushToSpreadsheet(products);

function getFilteredShoppingProducts(filters, ReportName) {
	var campaignField = ''
	if (USE_CAMPAIGN_FILTER) {
		campaignField = 'campaign.name, ';
		filters = filters + FILTER_CAMPAIGN_NAME
	}
	var query = 'SELECT segments.product_item_id, ' +
		campaignField +
		'segments.product_custom_attribute' + CUSTOM_LABEL_NR + ', ' +
		'metrics.clicks, metrics.impressions, metrics.conversions ' +
		'FROM shopping_performance_view WHERE ' + filters +
		' AND segments.product_item_id != "undefined"' +
		' AND segments.date DURING ' + TIME_DURATION +
		' ORDER BY metrics.conversions DESC LIMIT ' + COUNT_LIMIT;
	var products = [];
	var count = 0;
  var count_new = 0;

  // Podgląd query w razie problemów z filtrami
  //Logger.log(query);
  
	var report = AdsApp.report(query);
  
  // Raportowanie
  report.exportToSheet(SpreadsheetApp.openByUrl(SPREADSHEET_URL).getSheetByName(ReportName));

  
	var rows = report.rows();
	while (rows.hasNext()) {
		var row = rows.next();
		var clicks = row['metrics.clicks'];
    var impressions = row['metrics.impressions'];
		var conversions = row['metrics.conversions'];
		var productId = row['segments.product_item_id']
    var label = row['segments.product_custom_attribute4']

		// Label product as LABEL_BESTSELLERS
		if (label != LABEL_BESTSELLERS && conversions > BESTSELLER_FLOOR) {
			products.push([productId.toUpperCase(), LABEL_BESTSELLERS]);
			count += 1;
		} 
	}
	Logger.log(count);
	return products;
}

// Funkcja do raportowania
function getReport(filters, ReportName) {
	var campaignField = ''
	if (USE_CAMPAIGN_FILTER) {
		campaignField = 'campaign.name, ';
		filters = filters + FILTER_CAMPAIGN_NAME
	}
	var query = 'SELECT segments.product_item_id, ' +
		campaignField +
		'segments.product_custom_attribute' + CUSTOM_LABEL_NR + ', ' +
		'metrics.clicks, metrics.impressions, metrics.conversions ' +
		'FROM shopping_performance_view WHERE ' + filters +
		' AND segments.product_item_id != "undefined"' +
		' AND segments.date DURING ' + TIME_DURATION +
		' ORDER BY metrics.conversions DESC LIMIT ' + COUNT_LIMIT;
	var products = [];
	var count = 0;
  var count_new = 0;

  // Podgląd query w razie problemów z filtrami
  //Logger.log(query);
	var report = AdsApp.report(query);
  report.exportToSheet(SpreadsheetApp.openByUrl(SPREADSHEET_URL).getSheetByName(ReportName));
}

// Funkcja eksportująca nowe dane
function pushToSpreadsheet(data) {
	var spreadsheet = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
	var sheet = spreadsheet.getSheetByName('Data');
	var lastRow = sheet.getMaxRows();
	sheet.getRange('A2:B' + lastRow).clearContent();
	var start_row = 2;
	var endRow = start_row + data.length - 1;
	var range = sheet.getRange(
		'A' + start_row + ':' +
		'B' + endRow);
	if (data.length > 0) {
		range.setValues(data);
	}
	return;
}
