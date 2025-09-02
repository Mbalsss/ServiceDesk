import { tickets } from '@supabase/supabase-js';

// 1. Paste your actual URL and anon key here
const supabaseUrl = "https://pqmouynclmvyuspagcxc.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxbW91eW5jbG12eXVzcGFnY3hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NzEzNjIsImV4cCI6MjA2OTU0NzM2Mn0.QpHfVPpME8tyInPPraj1xLAciSGa6wpKol1MstmPHeU";
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugSupabase() {
  console.clear();
  console.log("🔍 Testing Supabase connection...");

  // 2. Test SELECT
  const { data: selectData, error: selectError } = await supabase
    .from("tickets") // ✅ Make sure this matches your table name exactly
    .select("*");

  if (selectError) {
    console.error("❌ SELECT failed:", selectError);
  } else {
    console.log("✅ SELECT success. Found rows:", selectData.length);
    console.table(selectData);
  }

  // 3. Test INSERT
  const { data: insertData, error: insertError } = await supabase
    .from("tickets")
    .insert([{ title: "Test Ticket", description: "Checking Supabase connection" }]);

  if (insertError) {
    console.error("❌ INSERT failed:", insertError);
  } else {
    console.log("✅ INSERT success:", insertData);
  }
}

debugSupabase();
