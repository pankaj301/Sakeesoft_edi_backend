module.exports ={

    mysqldb_query:{      
        
            
         //for customer
     selectAllcustomerQuery : 'SELECT COUNT(*) AS count FROM Cash_app_Lifestar_sales',
     insert:'INSERT INTO  Cash_app_Lifestar_sales values(?,?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?, ?, ?, ?, ?, ?,?,?, ?, ?, ?, ?, ?, ?, ? )',
    //  selecttoptencustomer:'SELECT DISTINCT Customer_Name, SUM(Invoice_Amt) as Total_Amount FROM Cash_app_Lifestar_sales GROUP BY Customer_Name ORDER BY Total_Amount DESC LIMIT 10 ',
    selecttoptencustomer :'SELECT SUBSTRING_INDEX(customername, " ", 1) AS Customer_Start_Name, SUM(Invoiceamount) as Total_Amount FROM Cash_app_Lifestar_sales GROUP BY SUBSTRING_INDEX(customername, " ", 1) ORDER BY Total_Amount DESC LIMIT 10',
     selectndc:'SELECT DISTINCT NDC_No,NDC_Desc, SUM(Invoiceamount) as Total_Amount FROM Cash_app_Lifestar_sales GROUP BY NDC_Desc ORDER BY Total_Amount DESC LIMIT 10',
       // local
     cashappCardinalTruncate:'TRUNCATE TABLE customer_ledger_view_cardinal;',
     cashappCardinalInsert:'INSERT INTO  customer_ledger_view_cardinal values(?, ?, ?, ?, ?, ?, ?, ?)',
     cashappCardinalCount:'SELECT COUNT(*) FROM customer_ledger_view_cardinal',
     cashappABCTruncate:'TRUNCATE TABLE customer_ledger_view_abc;',
     cashappABCInsert:'INSERT INTO  customer_ledger_view_abc values(?, ?, ?, ?, ?, ?, ?, ?)',
     cashappABCCount:'SELECT COUNT(*) FROM customer_ledger_view_abc',
     cashappMckessonTruncate:'TRUNCATE TABLE customer_ledger_view_mckesson;',
     cashappMckessonInsert:'INSERT INTO  customer_ledger_view_mckesson values(?, ?, ?, ?, ?, ?, ?, ?)',
     cashappMckessonCount:'SELECT COUNT(*) FROM customer_ledger_view_mckesson'


    }
}