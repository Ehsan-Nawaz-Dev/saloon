import { BASE_URL } from './config'; // default export exists

// Define the base endpoint for products mounted at /api/products
const PRODUCTS_ENDPOINT = `${BASE_URL}/products`;

// Helper function to create FormData for product uploads
const createProductFormData = productData => {
  const formData = new FormData(); // Add main product data

  formData.append('name', productData.productName || productData.name || ''); // Add main product image

  if (productData.productImage) {
    // Handle both URI strings and local asset numbers
    let imageUri = productData.productImage; // If it's a local asset (number), we need to handle it differently

    if (typeof productData.productImage === 'number') {
      // For local assets, we'll skip the image upload for now
      // You might want to convert local assets to base64 or handle them differently
      console.log('Local asset detected, skipping image upload');
    } else if (typeof productData.productImage === 'string') {
      // For URI strings (from image picker), create proper file object

      // Determine file type from URI
      let fileType = 'image/jpeg'; // default
      let fileName = 'product_image.jpg'; // default

      if (imageUri.includes('.png')) {
        fileType = 'image/png';
        fileName = 'product_image.png';
      } else if (imageUri.includes('.gif')) {
        fileType = 'image/gif';
        fileName = 'product_image.gif';
      } else if (imageUri.includes('.webp')) {
        fileType = 'image/webp';
        fileName = 'product_image.webp';
      }

      const imageFile = {
        uri: imageUri,
        type: fileType,
        name: fileName,
      }; // Log the image file being created

      console.log('Creating image file for upload:', imageFile);

      formData.append('image', imageFile);
    }
  } // Add sub-products data

  const subProducts =
    productData.productDetails || productData.subProducts || [];
  if (subProducts.length > 0) {
    formData.append(
      'subProducts',
      JSON.stringify(
        subProducts.map((sub, index) => ({
          name: sub.productDetailName || sub.name || '',
          price: parseFloat(sub.price) || 0,
          time: sub.time || '',
          description: sub.description || '', // Include image hint in JSON for backends that read this field
          image: sub.productDetailImage || sub.image || '',
        })),
      ),
    ); // Add sub-product images

    subProducts.forEach((sub, index) => {
      if (sub.productDetailImage || sub.image) {
        let subImageUri = sub.productDetailImage || sub.image; // Only handle string URIs for sub-product images

        if (typeof subImageUri === 'string') {
          // Determine file type from URI
          let fileType = 'image/jpeg'; // default
          let fileName = `subProductImage${index}.jpg`; // default

          if (subImageUri.includes('.png')) {
            fileType = 'image/png';
            fileName = `subProductImage${index}.png`;
          } else if (subImageUri.includes('.gif')) {
            fileType = 'image/gif';
            fileName = `subProductImage${index}.gif`;
          } else if (subImageUri.includes('.webp')) {
            fileType = 'image/webp';
            fileName = `subProductImage${index}.webp`;
          }

          const subImageFile = {
            uri: subImageUri,
            type: fileType,
            name: fileName,
          }; // Append under multiple common field names to maximize backend compatibility
          formData.append(`subProductImage${index}`, subImageFile);
          formData.append(`productDetailImage${index}`, subImageFile);
        }
      }
    });
  }

  // New: Add the 'isHiddenFromEmployee' status to the form data
  if (productData.isHiddenFromEmployee != null) {
    formData.append(
      'isHiddenFromEmployee',
      String(productData.isHiddenFromEmployee),
    );
  } // Log the FormData contents for debugging

  console.log('FormData created with:', {
    name: productData.productName || productData.name,
    hasImage: !!productData.productImage,
    subProductsCount: subProducts.length,
  });

  return formData;
};

const productsApi = {
  /**
   * Fetches all products from the backend.
   * @returns {Promise<Array>} A promise that resolves to an array of product objects.
   * @throws {Error} If the network request fails or the server responds with an error.
   */
  getAllProducts: async (token, queryParams) => {
    try {
      let url = `${PRODUCTS_ENDPOINT}/all`;
      if (queryParams && typeof queryParams === 'object') {
        const usp = new URLSearchParams();
        Object.entries(queryParams).forEach(([k, v]) => {
          if (v != null && v !== '') usp.append(k, v);
        });
        const qs = usp.toString();
        if (qs) url += `?${qs}`;
      }
      console.log('🔍 Fetching products from:', url);
      console.log('🔍 Token provided:', !!token); // Fixed endpoint: /api/products/all

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorJson = JSON.parse(errorBody);
          errorMessage = errorJson.message || errorMessage;
        } catch (parseError) {
          errorMessage = `${errorMessage}, response: ${errorBody}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }
  /**
   * Change product status (show/hide)
   */,

  changeStatus: async (id, status, token) => {
    try {
      // Products router uses "/:id/status" (no /admin prefix)
      const response = await fetch(`${PRODUCTS_ENDPOINT}/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const errorBody = await response.text();
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorJson = JSON.parse(errorBody);
          errorMessage = errorJson.message || errorMessage;
        } catch (parseError) {
          errorMessage = `${errorMessage}, response: ${errorBody}`;
        }
        throw new Error(errorMessage);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error changing product status:', error);
      throw error;
    }
  }
  /**
   * Adds a new product to the backend.
   * @param {Object} productData - The data for the new product with images.
   * @param {string} token - Authentication token.
   * @returns {Promise<Object>} A promise that resolves to the newly created product object.
   * @throws {Error} If the network request fails or the server responds with an error.
   */,

  addProduct: async (productData, token) => {
    try {
      console.log('Adding product with data:', {
        name: productData.productName || productData.name,
        hasImage: !!productData.productImage,
        imageType: typeof productData.productImage,
        subProductsCount: (
          productData.productDetails ||
          productData.subProducts ||
          []
        ).length,
      });

      const formData = createProductFormData(productData); // Fixed endpoint: /api/products/add

      const response = await fetch(`${PRODUCTS_ENDPOINT}/add`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData, // FormData for file uploads
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Error response body:', errorBody);

        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorJson = JSON.parse(errorBody);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch (parseError) {
          errorMessage = `${errorMessage}, response: ${errorBody}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Product added successfully:', data);
      return data;
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  }
  /**
   * Edits an existing product in the backend.
   * @param {string} id - The ID of the product to edit.
   * @param {Object} productData - The updated data for the product with images.
   * @param {string} token - Authentication token.
   * @returns {Promise<Object>} A promise that resolves to the updated product object.
   * @throws {Error} If the network request fails or the server responds with an error.
   */,

  editProduct: async (id, productData, token) => {
    try {
      const formData = createProductFormData(productData); // Fixed endpoint: /api/products/:id

      const response = await fetch(`${PRODUCTS_ENDPOINT}/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData, // FormData for file uploads
      });

      if (!response.ok) {
        const errorBody = await response.text();
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorJson = JSON.parse(errorBody);
          errorMessage = errorJson.message || errorMessage;
        } catch (parseError) {
          errorMessage = `${errorMessage}, response: ${errorBody}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error editing product with ID ${id}:`, error);
      throw error;
    }
  }
  /**
   * Deletes a product from the backend.
   * @param {string} id - The ID of the product to delete.
   * @param {string} token - Authentication token.
   * @returns {Promise<Object>} A promise that resolves to a success message or confirmation.
   * @throws {Error} If the network request fails or the server responds with an error.
   */,

  deleteProduct: async (id, token) => {
    try {
      // Fixed endpoint: /api/products/:id
      const response = await fetch(`${PRODUCTS_ENDPOINT}/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorJson = JSON.parse(errorBody);
          errorMessage = errorJson.message || errorMessage;
        } catch (parseError) {
          errorMessage = `${errorMessage}, response: ${errorBody}`;
        }
        throw new Error(errorMessage);
      }

      const text = await response.text();
      return text
        ? JSON.parse(text)
        : { message: 'Product deleted successfully' };
    } catch (error) {
      console.error(`Error deleting product with ID ${id}:`, error);
      throw error;
    }
  },
};

// Named exports for individual functions
export const getProducts = productsApi.getAllProducts;
export const addProduct = productsApi.addProduct;
export const updateProduct = productsApi.editProduct;
export const deleteProduct = productsApi.deleteProduct;
export const changeProductStatus = productsApi.changeStatus;

export default productsApi;
