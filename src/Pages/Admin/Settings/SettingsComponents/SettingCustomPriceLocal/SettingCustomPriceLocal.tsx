import React, { useState, useEffect } from "react";
import { FiEdit2, FiSave } from "react-icons/fi";
import { useDispatch } from "react-redux";
import "./SettingCustomPriceLocal.css";
import {
  setLocalPrice,
  fetchLocalPrice,
} from "../../../../../Redux/Settings/SettingsSlice";
import { AppDispatch } from "../../../../../Redux/store";
import { useToast } from "../../../../../Context/ToastProvider";

const SettingCustomPriceLocal: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [isEditing, setIsEditing] = useState(false);
  const [price, setPrice] = useState<number>(0);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<any>(null);

  const { addToast } = useToast();
  useEffect(() => {
    setFetchLoading(true);
    setFetchError(null);
    dispatch(fetchLocalPrice())
      .unwrap()
      .then((response) => {
        setPrice(response.localPrice);
        setFetchLoading(false);
      })
      .catch((err) => {
        setFetchError(err);
        setFetchLoading(false);
        console.error("❌ Error fetching price:", err);
      });
  }, [dispatch]);

  const handleToggleEdit = () => {
    if (isEditing) {
      if (isNaN(price)) {
        addToast("error", "Price must be a valid number.");

        return;
      }
      setIsSaving(true);
      setSaveError(null);
      dispatch(setLocalPrice({ localPrice: price }))
        .unwrap()
        .then((response) => {
          addToast("success", "✅ Price saved successfully!");
          console.log("✅ Price saved successfully:", response);
          setIsEditing(false);
          setIsSaving(false);
        })
        .catch((err) => {
          console.error("❌ Error saving price:", err);
          addToast("error", "Price must be a valid number.");
          setSaveError(err);
          setIsSaving(false);
        });
    } else {
      setIsEditing(true);
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!isNaN(Number(value))) {
      setPrice(Number(value));
    } else {
      addToast("error", "Price must be a number.");
    }
  };

  return (
    <div className="settings-price-container" style={{ marginTop: "2rem" }}>
      <p>
        Set the custom price for all local users in Nigeria. The amount is
        charged in Nigerian Naira (₦).
      </p>
      {fetchLoading ? (
        <p>Loading current price...</p>
      ) : (
        <>
          {fetchError && (
            <p className="error-message">
              Error fetching price: {fetchError.message || fetchError}
            </p>
          )}
          {saveError && (
            <p className="error-message">
              Error saving price: {saveError.message || saveError}
            </p>
          )}
          <div className="price-card">
            <div className="price-display">
              <span>Current Price:</span>
              {isEditing ? (
                <input
                  value={price}
                  onChange={handlePriceChange}
                  className="price-input"
                />
              ) : (
                <span className="price-value">₦{price?.toLocaleString()}</span>
              )}
            </div>
            <button
              onClick={handleToggleEdit}
              className="edit-btn"
              disabled={isSaving || fetchLoading}
            >
              {isSaving ? (
                "Saving..."
              ) : isEditing ? (
                <>
                  <FiSave /> Save Changes
                </>
              ) : (
                <>
                  <FiEdit2 /> Edit
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default SettingCustomPriceLocal;
