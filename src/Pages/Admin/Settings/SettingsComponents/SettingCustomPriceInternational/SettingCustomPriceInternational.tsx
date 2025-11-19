import React, { useState, useEffect } from "react";
import { FiEdit2, FiSave } from "react-icons/fi";
import { useDispatch } from "react-redux";
import "./SettingCustomPriceInternational.css";
import {
  setInternationalPrice,
  fetchInternationalPrice,
} from "../../../../../Redux/Slices/SettingsSlice";
import { useToast } from "../../../../../Context/ToastProvider";
import { AppDispatch } from "../../../../../Redux/store";

const SettingCustomPriceInternational: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { addToast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [price, setPrice] = useState<number>(0);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<any>(null);

  // Fetch the current international price on mount
  useEffect(() => {
    setFetchLoading(true);
    setFetchError(null);

    dispatch(fetchInternationalPrice())
      .unwrap()
      .then((response) => {
        setPrice(response.internationalPrice);
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
      if (isNaN(price) || price <= 0) {
        addToast("error", "Please enter a valid number greater than 0.");
        return;
      }

      setIsSaving(true);
      setSaveError(null);

      dispatch(setInternationalPrice({ internationalPrice: price }))
        .unwrap()
        .then((response) => {
          console.log("✅ Price saved:", response);
          addToast("success", "Price updated successfully.");
          setIsEditing(false);
          setIsSaving(false);
        })
        .catch((err) => {
          console.error("❌ Error saving price:", err);
          setSaveError(err);
          addToast("error", "Failed to update price.");
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
    }
  };

  return (
    <div className="settings-price-container">
      <h2 className="setting-title">Set International Price</h2>
      <p className="setting-description">
        This allows you to define a custom price for all users outside the local region.
        The amount will be charged in USD and applies universally to all international transactions.
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
                  type="number"
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

export default SettingCustomPriceInternational;