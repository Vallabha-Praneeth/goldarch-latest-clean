"""
Marimo Interactive Dashboard - Quote Analytics
Run with: marimo edit scripts/quote_analytics.py

This demonstrates how Marimo COULD be used for quote analytics.
Install: pip install marimo pandas plotly
"""

import marimo

__generated_with = "0.9.0"
app = marimo.App()


@app.cell
def __():
    import marimo as mo
    import os
    from datetime import datetime, timedelta
    mo.md("# Quote Builder Analytics Dashboard")
    return mo, os, datetime, timedelta


@app.cell
def __(mo):
    mo.md("""
    ## 📊 Real-time Quote Metrics

    This interactive notebook connects to your Supabase database
    and provides live analytics on quote performance.
    """)
    return


@app.cell
def __(os):
    # Connect to Supabase (using environment variables)
    from supabase import create_client

    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

    if not supabase_url or not supabase_key:
        raise ValueError("Missing Supabase credentials in .env")

    supabase = create_client(supabase_url, supabase_key)
    return supabase, create_client


@app.cell
def __(mo):
    # Interactive date range selector
    date_range = mo.ui.date_range(
        start=mo.ui.date(value="2026-01-01"),
        stop=mo.ui.date(value="2026-12-31"),
        label="Select Date Range"
    )
    date_range
    return date_range,


@app.cell
def __(supabase, date_range):
    import pandas as pd

    # Fetch quotes within date range
    response = supabase.table('quotations').select(
        'id, quote_number, status, total, created_at, lead_id'
    ).gte('created_at', date_range.value[0]).lte('created_at', date_range.value[1]).execute()

    quotes_df = pd.DataFrame(response.data)

    if len(quotes_df) > 0:
        quotes_df['created_at'] = pd.to_datetime(quotes_df['created_at'])
        quotes_df['total'] = quotes_df['total'].astype(float)

    return quotes_df, pd, response


@app.cell
def __(quotes_df, mo):
    # Display summary metrics
    if len(quotes_df) > 0:
        total_quotes = len(quotes_df)
        total_value = quotes_df['total'].sum()
        avg_quote = quotes_df['total'].mean()

        mo.hstack([
            mo.stat(
                label="Total Quotes",
                value=f"{total_quotes:,}",
                caption="in selected period"
            ),
            mo.stat(
                label="Total Value",
                value=f"${total_value:,.2f}",
                caption="across all quotes"
            ),
            mo.stat(
                label="Average Quote",
                value=f"${avg_quote:,.2f}",
                caption="per quote"
            )
        ])
    else:
        mo.callout("No quotes found in selected date range", kind="warn")
    return total_quotes, total_value, avg_quote


@app.cell
def __(quotes_df, mo):
    # Status breakdown
    if len(quotes_df) > 0:
        status_counts = quotes_df['status'].value_counts()

        mo.ui.table(
            status_counts.reset_index(),
            label="Quote Status Breakdown"
        )
    return status_counts,


@app.cell
def __(quotes_df):
    # Time series chart
    import plotly.express as px

    if len(quotes_df) > 0:
        daily_quotes = quotes_df.groupby(
            quotes_df['created_at'].dt.date
        ).agg({
            'total': 'sum',
            'id': 'count'
        }).reset_index()

        daily_quotes.columns = ['date', 'revenue', 'count']

        fig = px.line(
            daily_quotes,
            x='date',
            y='revenue',
            title='Daily Quote Revenue',
            labels={'revenue': 'Total Revenue ($)', 'date': 'Date'}
        )

        fig
    return px, daily_quotes, fig


@app.cell
def __(supabase, mo):
    # Interactive quote inspector
    quote_id_input = mo.ui.text(
        placeholder="Enter Quote ID",
        label="Inspect Quote Details"
    )
    quote_id_input
    return quote_id_input,


@app.cell
def __(supabase, quote_id_input, mo):
    # Fetch and display quote details
    if quote_id_input.value:
        quote_response = supabase.table('quotations').select(
            '*, quotation_lines(*), quote_leads(*)'
        ).eq('id', quote_id_input.value).single().execute()

        if quote_response.data:
            quote = quote_response.data

            mo.vstack([
                mo.md(f"## Quote {quote['quote_number']}"),
                mo.md(f"**Customer:** {quote['quote_leads']['name']}"),
                mo.md(f"**Email:** {quote['quote_leads']['email']}"),
                mo.md(f"**Status:** {quote['status']}"),
                mo.md(f"**Total:** ${quote['total']:,.2f}"),
                mo.md("### Line Items"),
                mo.ui.table(quote['quotation_lines'])
            ])
        else:
            mo.callout("Quote not found", kind="danger")
    return quote_response, quote


@app.cell
def __(mo):
    mo.md("""
    ---

    ## 🔍 What This Demonstrates

    **Marimo is useful for:**
    - ✅ Interactive data exploration
    - ✅ Real-time analytics dashboards
    - ✅ Testing database queries
    - ✅ Visualizing trends

    **But NOT for:**
    - ❌ Testing TypeScript/React code
    - ❌ Running Next.js tests
    - ❌ Replacing Jest/Vitest

    **Better alternatives for testing:**
    - CodeRabbit (AI PR reviews)
    - Jest/Vitest (unit tests)
    - Playwright (E2E tests)
    """)
    return


if __name__ == "__main__":
    app.run()
