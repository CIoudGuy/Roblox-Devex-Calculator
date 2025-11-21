// Static currency list and USD conversion factors.
// Values are USD per 1 unit of the currency (approximate, can be updated).
(function () {
  const list = [
    { code: "USD", name: "US Dollar", rateToUsd: 1 },
    { code: "EUR", name: "Euro", rateToUsd: 1.09 },
    { code: "GBP", name: "British Pound", rateToUsd: 1.27 },
    { code: "CAD", name: "Canadian Dollar", rateToUsd: 0.74 },
    { code: "AUD", name: "Australian Dollar", rateToUsd: 0.66 },
    { code: "NZD", name: "New Zealand Dollar", rateToUsd: 0.61 },
    { code: "JPY", name: "Japanese Yen", rateToUsd: 0.0067 },
    { code: "CNY", name: "Chinese Yuan", rateToUsd: 0.14 },
    { code: "KRW", name: "South Korean Won", rateToUsd: 0.00074 },
    { code: "INR", name: "Indian Rupee", rateToUsd: 0.012 },
    { code: "BRL", name: "Brazilian Real", rateToUsd: 0.18 },
    { code: "MXN", name: "Mexican Peso", rateToUsd: 0.055 },
    { code: "SGD", name: "Singapore Dollar", rateToUsd: 0.74 },
    { code: "HKD", name: "Hong Kong Dollar", rateToUsd: 0.128 },
    { code: "CHF", name: "Swiss Franc", rateToUsd: 1.13 },
    { code: "SEK", name: "Swedish Krona", rateToUsd: 0.095 },
    { code: "NOK", name: "Norwegian Krone", rateToUsd: 0.091 },
    { code: "ZAR", name: "South African Rand", rateToUsd: 0.053 },
    { code: "PLN", name: "Polish Zloty", rateToUsd: 0.25 },
    { code: "TRY", name: "Turkish Lira", rateToUsd: 0.028 },
    { code: "TWD", name: "New Taiwan Dollar", rateToUsd: 0.031 },
    { code: "PHP", name: "Philippine Peso", rateToUsd: 0.018 },
    { code: "THB", name: "Thai Baht", rateToUsd: 0.028 },
    { code: "AED", name: "UAE Dirham", rateToUsd: 0.27 },
    { code: "SAR", name: "Saudi Riyal", rateToUsd: 0.27 },
    { code: "DKK", name: "Danish Krone", rateToUsd: 0.15 },
    { code: "BGN", name: "Bulgarian Lev", rateToUsd: 0.56 },
    { code: "RON", name: "Romanian Leu", rateToUsd: 0.22 },
    { code: "ILS", name: "Israeli Shekel", rateToUsd: 0.26 },
    { code: "ISK", name: "Icelandic Krona", rateToUsd: 0.0072 },
    { code: "IDR", name: "Indonesian Rupiah", rateToUsd: 0.000065 },
    { code: "HUF", name: "Hungarian Forint", rateToUsd: 0.0028 },
    { code: "CZK", name: "Czech Koruna", rateToUsd: 0.043 },
    { code: "MYR", name: "Malaysian Ringgit", rateToUsd: 0.21 },
    { code: "ARS", name: "Argentine Peso", rateToUsd: 0.0011 },
    { code: "CLP", name: "Chilean Peso", rateToUsd: 0.0011 },
  ];

  const fxToUsd = Object.fromEntries(list.map((c) => [c.code, c.rateToUsd]));

  window.currencyList = list;
  window.fxToUsd = fxToUsd;
})();
