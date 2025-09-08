# Rainbow Room Inventory Management System

A secure inventory tracking system for the Children's Advocacy Center's Rainbow Room donation center.

## Features

- Encrypted SQLite database with SQLCipher
- QR code-based inventory management
- Item checkout tracking
- Volunteer session logging
- Web-based interface for shared device usage

## Quick Start

```bash
npm install
npm run setup
npm run dev
```

## Database Structure

The system uses an encrypted SQLite database with the following main tables:
- `items` - Item categories with QR codes
- `item_sizes` - Size variants with inventory counts  
- `checkouts` - Transaction headers
- `checkout_items` - Individual line items
- `volunteer_sessions` - Volunteer time tracking

## Security

This application uses SQLCipher for database encryption to protect sensitive inventory and volunteer data.