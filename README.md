# Jordan Plus Pharmaceutical

A responsive pharmaceutical supply website for Jordan Plus Pharmaceutical, serving pharmacies, clinics, hospitals, and retail customers from Koan.

## Features

- Browse medicines and medical supplies by category
- Select pack, roll, or carton pricing
- Live shopping cart powered by React
- Bulk order form with delivery and pickup options
- Order summaries sent through WhatsApp or email
- Client-side account creation and login demo
- Customer reviews stored in the browser
- Contact form and responsive Bootstrap layout

## Project structure

- `index.html` — Main website page and layout
- `script.js` — Catalog rendering, authentication demo, reviews, contact form, and cart event bus
- `order-cart.jsx` — React order cart and bulk-order form
- `style.css` — Custom Jordan Plus styling
- `assets/` — Logo and image assets

## Running locally

This is a browser-based static website and does not require a build step.

1. Clone the repository:

   ```bash
   git clone https://github.com/ninnyann-cyber/jordanplus.git
   cd jordanplus
   ```

2. Open `index.html` in a browser, or serve the folder with a local web server:

   ```bash
   python3 -m http.server 8000
   ```

3. Visit [http://localhost:8000](http://localhost:8000).

The page loads Bootstrap, Bootstrap Icons, React, ReactDOM, Babel, and Google Fonts from CDNs, so an internet connection is needed for the complete experience.

## Important note

This project is currently a front-end demo. Accounts, reviews, carts, and submitted orders are stored in `localStorage`; no secure backend or payment processing is included. Replace the client-side storage and email/WhatsApp links with a production API before using this for real transactions.

Medicines should be supplied and purchased in accordance with applicable pharmaceutical regulations.

## Contact

- WhatsApp / phone: [+234 803 590 5191](tel:+2348035905191)
- Email: [jodaadedejio1@gmail.com](mailto:jodaadedejio1@gmail.com)
- Location: Koan

## License

No license has been specified for this repository yet.
