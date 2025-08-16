# Plunk Campaigns API Test

This test file verifies that your Plunk campaigns API function works correctly.

## Setup

1. **Set your Plunk API Secret:**
   You need to set the `PLUNK_SECRET` environment variable. You can do this in several ways:

   **Option A: Create a .env file**
   ```bash
   # Create a .env file in the project root
   echo "PLUNK_SECRET=your_actual_secret_here" > .env
   ```

   **Option B: Set environment variable directly**
   ```bash
   # Windows PowerShell
   $env:PLUNK_SECRET="your_actual_secret_here"
   
   # Windows Command Prompt
   set PLUNK_SECRET=your_actual_secret_here
   
   # Linux/Mac
   export PLUNK_SECRET=your_actual_secret_here
   ```

2. **Get your Plunk API Secret:**
   - Go to https://useplunk.com/dashboard/api
   - Copy your API secret key
   - Replace `your_actual_secret_here` with your actual secret

## Running the Test

```bash
node test-plunk-campaigns.js
```

## What the Test Does

The test file `test-plunk-campaigns.js` includes:

1. **Main Function Test:** Tests your exact function:
   ```javascript
   const r = await fetch("https://api.useplunk.com/v1/campaigns?limit=20&offset=0", {
     method: "GET",
     headers: {
       Authorization: `Bearer ${process.env.PLUNK_SECRET!}`,
       "Content-Type": "application/json",
     },
   });
   const data = await r.json();
   console.log(data); // array of campaigns
   ```

2. **Pagination Tests:** Tests different limit/offset combinations to verify pagination works

3. **Error Handling:** Comprehensive error checking and logging

4. **Response Analysis:** Shows the structure of returned data

## Expected Output

If successful, you should see:
- ✅ PLUNK_SECRET found
- 📡 Making request to Plunk Campaigns API...
- 📊 Response Status: 200
- ✅ Success! Response data: [array of campaigns]
- 📈 Found X campaigns

## Troubleshooting

- **"PLUNK_SECRET environment variable not found"**: Make sure you've set the environment variable correctly
- **"401 Unauthorized"**: Check that your API secret is correct
- **"404 Not Found"**: Verify the API endpoint URL
- **Network errors**: Check your internet connection

## API Documentation

For more information about the Plunk API, visit:
- https://useplunk.com/docs/api
- https://useplunk.com/dashboard/api
