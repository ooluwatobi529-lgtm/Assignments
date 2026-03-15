//https://fakestcreapi.com/products


//fetch("https://fakestoreapi.com/products")
//.then(response => response.json())
//.then(data => console.log(data))
//.catch(error => console.error(error))

//asychronous function

/*async function loadData() {
  let response = await fetch("missing.json");

  if (!response.ok) {
    console.log("HTTP Error:", response.status);
    return;
  }

  let data = await response.json();
  console.log(data);
}

loadData();*/

/*async function loadData() {
  try {
    let response = await fetch("data.json");
    let data = await response.json();
    console.log(data);
  } catch (error) {
    console.log("Network error");
  }
}*/

const container = document.querySelector("#container")

const getproduct = async () => {
    try{
const res = await fetch("https://dummyjson.com/products")
if (!res) throw new error("failed to fetch");
const data = await res.json();
console.log(data);

const cheapProduct = data.products.filter((x) => x.price < 10);
cheapProduct.forEach((product) => {
    const productEl = document.createElement("div");
    productEl.classList.add("product-card")
    productEl.classList = "product-card"
    productEl.innerHTML = `
    <span>${product.category}</span>
    <img src="${product.thumbnail}" alt="product-images"/>
    <h3>${product.title}</h3>
    <p>${product.description}</p>
    <strong>${product.price}</strong>
    <button> Add to card </button>
    `;



    container.appendChild(productEl);
});
    } catch (error) {
        console.log("error", error);
    }
};

getproduct();

