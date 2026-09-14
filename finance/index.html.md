```html
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KeuanganKu - Pencatatan Keuangan</title>

    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: Arial, Helvetica, sans-serif;
        }

        body {
            background: #f4f7fb;
            color: #1f2937;
        }

        .container {
            width: 92%;
            max-width: 1200px;
            margin: auto;
        }

        /* HEADER */
        header {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white;
            padding: 25px 0;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }

        header .container {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .logo h1 {
            font-size: 28px;
        }

        .logo p {
            margin-top: 5px;
            opacity: 0.85;
            font-size: 14px;
        }

        /* DASHBOARD */
        .dashboard {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin: 30px 0;
        }

        .card {
            background: white;
            padding: 25px;
            border-radius: 16px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.06);
        }

        .card h3 {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 10px;
        }

        .card .amount {
            font-size: 27px;
            font-weight: bold;
        }

        .saldo {
            border-left: 5px solid #2563eb;
        }

        .pemasukan {
            border-left: 5px solid #16a34a;
        }

        .pengeluaran {
            border-left: 5px solid #dc2626;
        }

        .green {
            color: #16a34a;
        }

        .red {
            color: #dc2626;
        }

        .blue {
            color: #2563eb;
        }

        /* MAIN */
        .main {
            display: grid;
            grid-template-columns: 350px 1fr;
            gap: 25px;
            margin-bottom: 40px;
        }

        /* FORM */
        .form-card h2,
        .history-card h2 {
            margin-bottom: 20px;
        }

        .form-group {
            margin-bottom: 16px;
        }

        label {
            display: block;
            margin-bottom: 7px;
            font-weight: bold;
            font-size: 14px;
        }

        input,
        select {
            width: 100%;
            padding: 12px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            outline: none;
            font-size: 14px;
        }

        input:focus,
        select:focus {
            border-color: #2563eb;
        }

        .btn {
            width: 100%;
            border: none;
            padding: 13px;
            border-radius: 8px;
            background: #2563eb;
            color: white;
            font-size: 15px;
            font-weight: bold;
            cursor: pointer;
        }

        .btn:hover {
            background: #1d4ed8;
        }

        /* FILTER */
        .filter {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }

        .filter button {
            padding: 9px 15px;
            border: none;
            border-radius: 7px;
            cursor: pointer;
            background: #e5e7eb;
        }

        .filter button.active {
            background: #2563eb;
            color: white;
        }

        /* TABLE */
        .table-wrapper {
            overflow-x: auto;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th,
        td {
            padding: 13px 10px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
            font-size: 14px;
        }

        th {
            color: #6b7280;
            font-size: 13px;
        }

        .badge {
            padding: 5px 9px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
        }

        .badge-income {
            background: #dcfce7;
            color: #166534;
        }

        .badge-expense {
            background: #fee2e2;
            color: #991b1b;
        }

        .delete-btn {
            border: none;
            background: #fee2e2;
            color: #dc2626;
            padding: 7px 10px;
            border-radius: 6px;
            cursor: pointer;
        }

        .delete-btn:hover {
            background: #fecaca;
        }

        .empty {
            text-align: center;
            padding: 40px 10px;
            color: #9ca3af;
        }

        /* FOOTER */
        footer {
            text-align: center;
            padding: 25px;
            color: #6b7280;
            font-size: 13px;
        }

        /* RESPONSIVE */
        @media (max-width: 800px) {
            .dashboard {
                grid-template-columns: 1fr;
            }

            .main {
                grid-template-columns: 1fr;
            }

            header .container {
                flex-direction: column;
                align-items: flex-start;
                gap: 10px;
            }
        }
    </style>
</head>

<body>

    <!-- HEADER -->
    <header>
        <div class="container">
            <div class="logo">
                <h1>💰 KeuanganKu</h1>
                <p>Aplikasi pencatatan keuangan pribadi</p>
            </div>

            <div id="currentDate"></div>
        </div>
    </header>


    <main class="container">

        <!-- DASHBOARD -->
        <section class="dashboard">

            <div class="card saldo">
                <h3>💳 Saldo Saat Ini</h3>
                <div class="amount blue" id="saldo">
                    Rp 0
                </div>
            </div>

            <div class="card pemasukan">
                <h3>📈 Total Pemasukan</h3>
                <div class="amount green" id="totalIncome">
                    Rp 0
                </div>
            </div>

            <div class="card pengeluaran">
                <h3>📉 Total Pengeluaran</h3>
                <div class="amount red" id="totalExpense">
                    Rp 0
                </div>
            </div>

        </section>


        <!-- MAIN CONTENT -->
        <section class="main">

            <!-- FORM TRANSAKSI -->
            <div class="card form-card">

                <h2>Tambah Transaksi</h2>

                <form id="transactionForm">

                    <div class="form-group">
                        <label for="type">
                            Jenis Transaksi
                        </label>

                        <select id="type" required>
                            <option value="income">
                                Pemasukan
                            </option>

                            <option value="expense">
                                Pengeluaran
                            </option>
                        </select>
                    </div>


                    <div class="form-group">
                        <label for="date">
                            Tanggal
                        </label>

                        <input
                            type="date"
                            id="date"
                            required
                        >
                    </div>


                    <div class="form-group">
                        <label for="category">
                            Kategori
                        </label>

                        <select id="category" required>

                            <option value="">
                                Pilih kategori
                            </option>

                            <option value="Gaji">
                                Gaji
                            </option>

                            <option value="Bonus">
                                Bonus
                            </option>

                            <option value="Makanan">
                                Makanan
                            </option>

                            <option value="Transportasi">
                                Transportasi
                            </option>

                            <option value="Belanja">
                                Belanja
                            </option>

                            <option value="Tagihan">
                                Tagihan
                            </option>

                            <option value="Pendidikan">
                                Pendidikan
                            </option>

                            <option value="Kesehatan">
                                Kesehatan
                            </option>

                            <option value="Hiburan">
                                Hiburan
                            </option>

                            <option value="Investasi">
                                Investasi
                            </option>

                            <option value="Lainnya">
                                Lainnya
                            </option>

                        </select>
                    </div>


                    <div class="form-group">
                        <label for="description">
                            Keterangan
                        </label>

                        <input
                            type="text"
                            id="description"
                            placeholder="Contoh: Belanja bulanan"
                            required
                        >
                    </div>


                    <div class="form-group">
                        <label for="amount">
                            Nominal
                        </label>

                        <input
                            type="number"
                            id="amount"
                            placeholder="Contoh: 500000"
                            min="1"
                            required
                        >
                    </div>


                    <button
                        type="submit"
                        class="btn"
                    >
                        + Simpan Transaksi
                    </button>

                </form>

            </div>


            <!-- RIWAYAT TRANSAKSI -->
            <div class="card history-card">

                <h2>Riwayat Transaksi</h2>

                <div class="filter">

                    <button
                        class="active"
                        data-filter="all"
                    >
                        Semua
                    </button>

                    <button
                        data-filter="income"
                    >
                        Pemasukan
                    </button>

                    <button
                        data-filter="expense"
                    >
                        Pengeluaran
                    </button>

                </div>


                <div class="table-wrapper">

                    <table>

                        <thead>

                            <tr>
                                <th>Tanggal</th>
                                <th>Kategori</th>
                                <th>Keterangan</th>
                                <th>Jenis</th>
                                <th>Nominal</th>
                                <th>Aksi</th>
                            </tr>

                        </thead>

                        <tbody id="transactionList">

                        </tbody>

                    </table>

                </div>

            </div>

        </section>

    </main>


    <footer>
        KeuanganKu © 2026 — Data transaksi tersimpan di browser Anda.
    </footer>


    <script>

        // =========================================
        // DATA TRANSAKSI
        // =========================================

        let transactions =
            JSON.parse(
                localStorage.getItem("transactions")
            ) || [];


        let currentFilter = "all";


        // =========================================
        // FORMAT RUPIAH
        // =========================================

        function formatRupiah(number) {

            return new Intl.NumberFormat(
                "id-ID",
                {
                    style: "currency",
                    currency: "IDR",
                    maximumFractionDigits: 0
                }
            ).format(number);

        }


        // =========================================
        // TANGGAL HARI INI
        // =========================================

        const today =
            new Date()
                .toISOString()
                .split("T")[0];

        document.getElementById("date").value =
            today;


        document.getElementById("currentDate")
            .textContent =
            new Date().toLocaleDateString(
                "id-ID",
                {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                }
            );


        // =========================================
        // FORM SUBMIT
        // =========================================

        document
            .getElementById("transactionForm")
            .addEventListener(
                "submit",
                function(event) {

                    event.preventDefault();


                    const type =
                        document.getElementById("type").value;

                    const date =
                        document.getElementById("date").value;

                    const category =
                        document.getElementById("category").value;

                    const description =
                        document.getElementById("description").value;

                    const amount =
                        Number(
                            document.getElementById("amount").value
                        );


                    const transaction = {

                        id: Date.now(),

                        type: type,

                        date: date,

                        category: category,

                        description: description,

                        amount: amount

                    };


                    transactions.push(transaction);


                    saveData();

                    renderTransactions();

                    updateDashboard();


                    document
                        .getElementById("transactionForm")
                        .reset();


                    document.getElementById("date").value =
                        today;

                }
            );


        // =========================================
        // SIMPAN DATA
        // =========================================

        function saveData() {

            localStorage.setItem(
                "transactions",
                JSON.stringify(transactions)
            );

        }


        // =========================================
        // UPDATE DASHBOARD
        // =========================================

        function updateDashboard() {

            let income = 0;

            let expense = 0;


            transactions.forEach(
                transaction => {

                    if (
                        transaction.type === "income"
                    ) {

                        income +=
                            transaction.amount;

                    } else {

                        expense +=
                            transaction.amount;

                    }

                }
            );


            const balance =
                income - expense;


            document.getElementById("totalIncome")
                .textContent =
                formatRupiah(income);


            document.getElementById("totalExpense")
                .textContent =
                formatRupiah(expense);


            document.getElementById("saldo")
                .textContent =
                formatRupiah(balance);

        }


        // =========================================
        // TAMPILKAN TRANSAKSI
        // =========================================

        function renderTransactions() {

            const list =
                document.getElementById(
                    "transactionList"
                );


            list.innerHTML = "";


            let filteredTransactions =
                transactions;


            if (
                currentFilter !== "all"
            ) {

                filteredTransactions =
                    transactions.filter(
                        transaction =>
                            transaction.type ===
                            currentFilter
                    );

            }


            // Urutkan transaksi terbaru
            filteredTransactions =
                [...filteredTransactions]
                .sort(
                    (a, b) =>
                        new Date(b.date) -
                        new Date(a.date)
                );


            if (
                filteredTransactions.length === 0
            ) {

                list.innerHTML = `

                    <tr>
                        <td
                            colspan="6"
                            class="empty"
                        >
                            Belum ada transaksi.
                        </td>
                    </tr>

                `;

                return;

            }


            filteredTransactions.forEach(
                transaction => {

                    const row =
                        document.createElement("tr");


                    const typeLabel =
                        transaction.type === "income"
                            ? "Pemasukan"
                            : "Pengeluaran";


                    const typeClass =
                        transaction.type === "income"
                            ? "badge-income"
                            : "badge-expense";


                    const amountClass =
                        transaction.type === "income"
                            ? "green"
                            : "red";


                    const sign =
                        transaction.type === "income"
                            ? "+"
                            : "-";


                    row.innerHTML = `

                        <td>
                            ${formatDate(transaction.date)}
                        </td>

                        <td>
                            ${transaction.category}
                        </td>

                        <td>
                            ${escapeHTML(
                                transaction.description
                            )}
                        </td>

                        <td>
                            <span
                                class="badge ${typeClass}"
                            >
                                ${typeLabel}
                            </span>
                        </td>

                        <td class="${amountClass}">
                            <strong>
                                ${sign}
                                ${formatRupiah(
                                    transaction.amount
                                )}
                            </strong>
                        </td>

                        <td>

                            <button
                                class="delete-btn"
                                onclick="deleteTransaction(
                                    ${transaction.id}
                                )"
                            >
                                Hapus
                            </button>

                        </td>

                    `;


                    list.appendChild(row);

                }
            );

        }


        // =========================================
        // FORMAT TANGGAL
        // =========================================

        function formatDate(date) {

            return new Date(
                date + "T00:00:00"
            ).toLocaleDateString(
                "id-ID",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            );

        }


        // =========================================
        // HAPUS TRANSAKSI
        // =========================================

        function deleteTransaction(id) {

            const confirmDelete =
                confirm(
                    "Yakin ingin menghapus transaksi ini?"
                );


            if (!confirmDelete) {
                return;
            }


            transactions =
                transactions.filter(
                    transaction =>
                        transaction.id !== id
                );


            saveData();

            renderTransactions();

            updateDashboard();

        }


        // =========================================
        // FILTER TRANSAKSI
        // =========================================

        document
            .querySelectorAll(".filter button")
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        function() {

                            document
                                .querySelectorAll(
                                    ".filter button"
                                )
                                .forEach(
                                    btn =>
                                        btn.classList
                                            .remove(
                                                "active"
                                            )
                                );


                            this.classList
                                .add("active");


                            currentFilter =
                                this.dataset.filter;


                            renderTransactions();

                        }
                    );

                }
            );


        // =========================================
        // KEAMANAN DASAR OUTPUT TEKS
        // =========================================

        function escapeHTML(text) {

            const div =
                document.createElement("div");

            div.textContent = text;

            return div.innerHTML;

        }


        // =========================================
        // JALANKAN APLIKASI
        // =========================================

        renderTransactions();

        updateDashboard();

    </script>

</body>
</html>
```
