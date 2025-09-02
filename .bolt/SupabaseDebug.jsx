import { tickets } from '@supabase/supabase-js';
import React, { useState } from 'react';

// 1. Replace these with your Supabase URL and anon key
const supabaseUrl = "https://pqmouynclmvyuspagcxc.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxbW91eW5jbG12eXVzcGFnY3hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NzEzNjIsImV4cCI6MjA2OTU0NzM2Mn0.QpHfVPpME8tyInPPraj1xLAciSGa6wpKol1MstmPHeU";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function SupabaseDebug() {
  const [log, setLog] = useState("");

  async function runTest() {
    setLog("🔍 Testing Supabase connection...\n");

    // 2. Test SELECT
    const { data: selectData, error: selectError } = await supabase
      .from("tickets") // ✅ Replace with your exact table name
      .select("*");

    if (selectError) {
      setLog(prev => prev + `❌ SELECT failed: ${selectError.message}\n`);
    } else {
      setLog(prev => prev + `✅ SELECT success. Found rows: ${selectData.length}\n`);
      console.table(selectData);
    }

    // 3. Test INSERT
    const { data: insertData, error: insertError } = await supabase
      .from("tickets")
      .insert([{ title: "Test Ticket", description: "Checking Supabase connection" }]);

    if (insertError) {
      setLog(prev => prev + `❌ INSERT failed: ${insertError.message}\n`);
    } else {
      setLog(prev => prev + `✅ INSERT success. ID: ${insertData[0].id}\n`);
    }
  }

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h2>Supabase Connection Test</h2>
      <button 
        onClick={runTest} 
        style={{
          padding: "10px 20px",
          background: "#4CAF50",
          color: "white",
          border: "none",
          cursor: "pointer",
          borderRadius: "5px"
        }}
      >
        Run Test
      </button>
      <pre style={{
        marginTop: "20px",
        background: "#f4f4f4",
        padding: "10px",
        borderRadius: "5px"
      }}>
        {log}
      </pre>
    </div>
  );
}
