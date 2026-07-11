# 🔑 Google Gemini API Key Generation Guide

This guide explains how to get a **free** Gemini API key from Google AI Studio and configure it in **SkillScout AI** to enable live, real-time AI-powered technical assessments.

---

## 🚀 Step 1: Get a Gemini API Key from Google AI Studio

1. **Go to Google AI Studio**
   Open [Google AI Studio](https://aistudio.google.com/) in your browser.

2. **Sign In**
   Sign in using any standard Google Account (e.g., your Gmail account).

3. **Click "Get API Key"**
   In the left sidebar or top navigation, click the **Get API key** (or **Create API key**) button.
   
   > [!NOTE]  
   > This button is typically located at the top of the left sidebar in Google AI Studio.

4. **Create a Key**
   - Click **Create API key**.
   - You can choose **Create API key in new project** (recommended) or choose an existing Google Cloud project if you have one.
   - Wait a few seconds for the key to be generated.

5. **Copy the Key**
   Copy the generated API key (it will look like a long string of characters starting with `AIzaSy...`). 
   
   > [!WARNING]  
   > Keep your API key secure. Do not share it publicly, commit it to GitHub, or expose it in public code repositories.

---

## ⚙️ Step 2: Configure the Key in SkillScout

SkillScout supports running in **Guest Sandbox Mode** where you can use your own API key directly from your browser. 

1. Navigate to the **SkillScout Dashboard** (`http://localhost:5173/dashboard` or the live demo).
2. Look for the **Offline Sandbox Active** banner or click the **Settings** button in the navigation bar.
3. In the **Guest Sandbox Settings** modal, paste your copied key into the **Gemini API Key** field.
4. Click **Save**.

Your API key will be saved securely and locally in your browser's `localStorage`.

---

## 🔒 Security & Privacy

* **Direct Browser Connection**: SkillScout uses this key to send requests *directly* from your browser to the official Google Generative Language API (`https://generativelanguage.googleapis.com`).
* **Zero Backend Exposure**: The key is never sent to, stored on, or processed by the SkillScout backend server.
* **Local Storage Only**: The key resides solely in your browser's persistent storage and can be cleared at any time by clicking **Clear All Sandbox Assessments** or logging out.

---

## 💰 Pricing & Rate Limits

Google AI Studio provides a **Free Tier** for the Gemini API:

| Model | Free Tier Limits | Cost | Recommended Use |
| :--- | :--- | :--- | :--- |
| **Gemini 1.5 Flash** / **Gemini 2.5 Flash** | 15 RPM (Requests Per Minute)<br>1,500 RPD (Requests Per Day) | **$0.00** (Free) | Perfect for running multiple full mock interviews and plan generations. |

If you reach the rate limits (e.g., sending messages too quickly), SkillScout will automatically apply exponential backoff and retry the request.
